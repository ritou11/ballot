Function May-Quit($enabled)
{
  if (!$enabled)
  {
    return $False
  }

  Write-Host -NoNewline "Continue? q to quit: "
  return $($(Read-Host) -eq "q")
}

Function kb-apply-t
{
  Param (
    [Parameter(Position=0, Mandatory=$True)]
    [string]$File,
    [string]$Namespace = "production",
    [int]$Instance = 1,
    [int]$Size = 10,
    [int]$Shard = 1,
    [int]$Shards = 2,
    [switch]$Delete = $False
  )

  if (Test-Path $File)
  {
    $rawyaml = @(gc $File)
  }
  elseif (Test-Path "${File}.yaml")
  {
    $rawyaml = @(gc "${File}.yaml")
  }
  else
  {
    throw "File not found: $File";
  }

  $yaml = New-Object System.Collections.ArrayList($null)
  $yaml.AddRange($rawyaml)

  For ($i = 0; $i -lt $yaml.Count; $i++)
  {
    if ($yaml[$i] -match '.*// EACH_SHARD$')
    {
      $str = $yaml[$i] -replace "// EACH_SHARD", ""
      $yaml.RemoveAt($i)
      For ($j = $Shards; $j -gt 0; $j--)
      {
        $yaml.Insert($i, ($str -replace "hardX", "hard$j"))
      }
      $i += $Shards
    }
  }

  $yaml = $yaml | sed -e "s/NAMESPACE_ID/$Namespace/g; s/INSTANCE/$Instance/g; s/SIZE/$Size/g; s/hardX/hard${Shard}/g"

  if (!$Delete)
  {
    $yaml | kubectl apply -f -
  }
  else
  {
    $yaml | kubectl delete -f -
  }
}

Function kb-mongo-up
{
  Param (
    [string]$Namespace = "production",
    [switch]$Confirm = $True,
    [int]$Instances = 2,
    [int]$SizeConfig = 5,
    [int]$SizeMain = 10,
    [int]$Shards = 2,
    [switch]$Delete = $False
  )

  kb-apply-t role.yaml -Namespace $Namespace -Delete:$Delete
  kb-apply-t namespace.yaml -Namespace $Namespace -Delete:$Delete
  kubectl get ns
  if (May-Quit $Confirm) { return; }

  kb-apply-t gce-ssd-storageclass.yaml
  kubectl get sc
  if (May-Quit $Confirm) { return; }

  if (!$Delete)
  {
    gcloud compute disks create --size "${SizeConfig}GB" --type pd-ssd "pd-ssd-disk-k8s-mongodb-${Namespace}-${SizeConfig}g-0"
    For ($i = 1; $i -le $Instances; $i++)
    {
      gcloud compute disks create --size "${SizeMain}GB" --type pd-ssd "pd-ssd-disk-k8s-mongodb-${Namespace}-${SizeMain}g-${i}"
    }
  }
  else
  {
    gcloud compute disks delete "pd-ssd-disk-k8s-mongodb-${Namespace}-${SizeConfig}g-0"
    For ($i = 1; $i -le $Instances; $i++)
    {
      gcloud compute disks delete "pd-ssd-disk-k8s-mongodb-${Namespace}-${SizeMain}g-${i}"
    }
  }

  kb-apply-t ext4-gce-ssd-persistentvolume.yaml -Namespace $Namespace -Size $SizeConfig -Instance 0 -Delete:$Delete
  For ($i = 1; $i -le $Instances; $i++)
  {
    kb-apply-t ext4-gce-ssd-persistentvolume.yaml -Namespace $Namespace -Size $SizeMain -Instance $i -Delete:$Delete
  }
  kubectl get pv
  if (May-Quit $Confirm) { return; }

  kb-apply-t mongodb-configdb-service-stateful.yaml -Namespace $Namespace -Size $SizeConfig -Delete:$Delete
  kubectl get svc,po "--namespace=$Namespace"
  if (May-Quit $Confirm) { return; }

  For ($i = 1; $i -le $Shards; $i++)
  {
    kb-apply-t mongodb-maindb-service-stateful.yaml -Namespace $Namespace -Size $SizeMain -Shard $i -Delete:$Delete
  }
  kubectl get svc,po "--namespace=$Namespace"
  if (May-Quit $Confirm) { return; }

  if (!$Delete)
  {
    kb-mongo-config -Namespace $Namespace -Shards $Shard
  }
}

Function kb-mongo-config
{
  Param (
    [string]$Namespace = "production",
    [string]$Shards = 2,
    [switch]$Configsvr = $True,
    [switch]$Maindb = $True,
    [switch]$Mongos = $True
  )

  $tmp = ".mongo-init.js~"

  if ($Configsvr)
  {
    $script = @"
rs.initiate({
  _id: "${Namespace}-configsvr",
  members: [{
  _id: 0,
  host: "mongodb-configdb-0.mongodb-configdb-headless-service.${Namespace}.svc.cluster.local:27019",
}]});
"@
    sc $tmp $script

    echo "Exec rs.initiate on mongodb-configdb-0"
    kubectl cp $tmp "$Namespace/mongodb-configdb-0:/tmp/mongo-init.js" -c "mongodb-configdb-container"
    kubectl exec "--namespace=$Namespace" "mongodb-configdb-0" -c "mongodb-configdb-container" -- mongo --port 27019 /tmp/mongo-init.js
  }

  if ($Maindb)
  {
    For ($i = 1; $i -le $Shards; $i++)
    {
      $script = @"
rs.initiate({
  _id: "${Namespace}-shard${i}",
  members: [{
  _id: 0,
  host: "mongodb-shard${i}-0.mongodb-shard${i}-headless-service.${Namespace}.svc.cluster.local:27017",
}]});
"@
      sc $tmp $script

      echo "Exec rs.initiate on mongodb-shard${i}-0"
      kubectl cp $tmp "$Namespace/mongodb-shard${i}-0:/tmp/mongo-init.js" -c "mongodb-shard${i}-container"
      kubectl exec "--namespace=$Namespace" "mongodb-shard${i}-0" -c "mongodb-shard${i}-container" -- mongo --port 27017 /tmp/mongo-init.js
    }
  }

  if ($Mongos)
  {
    $script = ""
    For ($i = 1; $i -le $Shards; $i++)
    {
      $script = $script + @"
sh.addShard("mongodb-${Namespace}/mongodb-shard${i}-0.mongodb-shard${i}-headless-service.${Namespace}.svc.cluster.local:27017");

"@
    }
    sc $tmp $script
    $pods = @(kubectl get pod "--namespace=$Namespace" -l "tier=routers" -o 'jsonpath="{range .items[*]}{.metadata.name}{\"\n\"}{end}"')
    ForEach ($pod In $pods)
    {
      echo "Exec sh.addShard on ${pod}"
      kubectl cp $tmp "$Namespace/${pod}:/tmp/mongo-init.js" -c "mongos-container"
      kubectl exec "--namespace=$Namespace" $pod -c "mongos-container" -- mongo --port 27017 /tmp/mongo-init.js
    }
  }

  rm $tmp
}
