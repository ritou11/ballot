const _ = require('lodash');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const transformImports = require('babel-plugin-transform-imports');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// eslint-disable-next-line import/no-extraneous-dependencies
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const extractCss0 = new ExtractTextPlugin({
  filename: 'assets/[name].[contenthash:8].css',
  allChunks: true,
});
const extractCss1 = new ExtractTextPlugin({
  filename: 'assets/[name].vendor.[contenthash:8].css',
  allChunks: true,
});

const minify = {
  removeComments: true,
  collapseWhitespace: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  keepClosingSlash: true,
  minifyJS: true,
  minifyCSS: true,
  minifyURLs: false,
};

const materialUiGroups = _.fromPairs([
  'BottomNavigation',
  'Card',
  'Dialog',
  'ExpansionPanel',
  'Form',
  'Input',
  'Gird',
  'List',
  'Menu',
  'Progress',
  'Radio',
  'Snackbar',
  'Table',
].map((g) => [g, new RegExp(`${g}($|[A-Z])|${g}$`)]));

const materialUiMap = (name) => {
  if (/^Tab($|[A-Z])/.test(name)) {
    return `material-ui/Tabs/${name}`;
  }
  if (/^Step($|[A-Z])/.test(name)) {
    return `material-ui/Step/${name}`;
  }
  switch (name) {
    case 'Backdrop':
      return `material-ui/Modal/${name}`;
    case 'Slide':
    case 'Grow':
    case 'Fase':
    case 'Collapse':
    case 'Zoom':
      return `material-ui/transitions/${name}`;
    case 'MuiThemeProvider':
    case 'withStyles':
    case 'withTheme':
    case 'createMuiTheme':
    case 'jssPreset':
      return `material-ui/styles/${name}`;
    default:
      break;
  }
  const cans = _.keys(_.pickBy(materialUiGroups, (r) => r.test(name)));
  if (cans.length === 1) {
    return `material-ui/${cans[0]}/${name}`;
  } else if (cans.length > 1) {
    throw new Error(`Unknown ${name}`);
  }
  return `material-ui/${name}`;
};

class BasicAssetsPlugin {
  apply(compiler) {
    compiler.plugin('emit', (compilation, cb) => {
      const data = `
User-Agent: *
Disallow: /*
Allow: /$
`.trimLeft();
      // eslint-disable-next-line no-param-reassign, no-underscore-dangle
      compilation.assets['robots.txt'] = {
        source: () => data,
        size: () => data.length,
      };
      cb();
    });
    compiler.plugin('emit', (compilation, cb) => {
      const data = `
/app/* /app.html 200!
/secret/* /secret/ 302
`.trimLeft();
      // eslint-disable-next-line no-param-reassign, no-underscore-dangle
      compilation.assets._redirects = {
        source: () => data,
        size: () => data.length,
      };
      cb();
    });
  }
}

class NetlifyHttp2PushPlugin {
  apply(compiler) {
    compiler.plugin('emit', (compilation, cb) => {
      _.keys(compilation.assets)
        .filter((a) => /^mock\../.test(a.replace(/^assets\//, '')))
        // eslint-disable-next-line no-param-reassign
        .forEach((a) => { delete compilation.assets[a]; });

      const entry = (e) => compilation.outputOptions.publicPath + e;
      const makePreload = (reg, as) => _.keys(compilation.assets)
        .filter((a) => reg.test(a.replace(/^assets\//, '')))
        .map((a) => `  Link: <${entry(a)}>; rel=preload; as=${as}`);
      const makeIndex = () => {
        const preloads = [];
        // outdatedbrowser.min.css
        preloads.push(...makePreload(/^outdated(browser)?\..*\.css/, 'style'));
        // index.css index.vender.css
        preloads.push(...makePreload(/^index\..*\.css/, 'style'));
        // index.js
        preloads.push(...makePreload(/^index\..*\.js$/, 'script'));
        return preloads.join('\n');
      };
      const makeApp = () => {
        const preloads = [];
        // outdatedbrowser.min.css
        preloads.push(...makePreload(/^outdated(browser)?\..*\.css/, 'style'));
        // app.css
        preloads.push(...makePreload(/^app\..*\.css/, 'style'));
        // app.js
        preloads.push(...makePreload(/^app\..*\.js$/, 'script'));
        // 0.chunk.js
        preloads.push(...makePreload(/^[0-9]+\..*\.chunk\.js$/, 'script'));
        return preloads.join('\n');
      };
      const data = `
/
${makeIndex()}
  Cache-Control: public, max-age=0, must-revalidate
/app/*
${makeApp()}
  Cache-Control: public, max-age=0, must-revalidate
/secret/*
  Cache-Control: public, max-age=0, must-revalidate
/assets/*
  Cache-Control: public, max-age=3153600
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
`.trimLeft();
      // eslint-disable-next-line no-param-reassign, no-underscore-dangle
      compilation.assets._headers = {
        source: () => data,
        size: () => data.length,
      };
      cb();
    });
  }
}

class PreloadPlugin {
  apply(compiler) {
    compiler.plugin('compilation', (compilation) => {
      // eslint-disable-next-line no-underscore-dangle
      compilation._pluginCompat.tap('html-webpack-plugin-before-html-processing', (htmlPluginData, cb) => {
        const entry = (e) => compilation.outputOptions.publicPath + e;
        const makePreload = (reg, as) => _.keys(compilation.assets)
          .filter((a) => reg.test(a.replace(/^assets\//, '')))
          .map((a) => `<link rel="preload" as="${as}" href="${entry(a)}">`);
        const makePrefetch = (reg) => _.keys(compilation.assets)
          .filter((a) => reg.test(a.replace(/^assets\//, '')))
          .map((a) => `<link rel="prefetch" href="${entry(a)}">`);

        const preloads = [];
        if (/^index/.test(htmlPluginData.plugin.options.filename)) {
          // outdatedbrowser.min.js outdated.js
          preloads.push(...makePreload(/^outdated(browser)?\..*\.js$/, 'script'));
          // index.js
          preloads.push(...makePreload(/^index\..*\.js$/, 'script'));
          // roboto-latin-400.woff2 roboto-latin-300.woff2
          preloads.push(...makePreload(/^roboto-latin-[34]00\..*\.woff2$/, 'font'));
          // NotoSansSC-Regular-X.woff2 NotoSansSC-Light-X.woff2
          preloads.push(...makePreload(/^NotoSansSC-(Regular|Light)-X\..*\.woff2$/, 'font'));
          // app.js
          preloads.push(...makePrefetch(/^app\..*\.js$/));
          // app.css
          preloads.push(...makePrefetch(/^app\..*\.css$/));
          // 0.chunk.js
          preloads.push(...makePrefetch(/^[0-9]+\..*\.chunk\.js$/, 'script'));
          // LoginContainer.chunk.js
          preloads.push(...makePrefetch(/^LoginContainer.*\.chunk\.js$/));
          // HomeContainer.chunk.js
          preloads.push(...makePrefetch(/^HomeContainer.*\.chunk\.js$/));
          // NotoSansSC-Regular.woff2
          preloads.push(...makePrefetch(/^NotoSansSC-Regular\..*\.woff2$/));
        } else if (/^app/.test(htmlPluginData.plugin.options.filename)) {
          // outdatedbrowser.min.js outdated.js
          preloads.push(...makePreload(/^outdated(browser)?\..*\.js$/, 'script'));
          // app.js common-app.chunk.js
          preloads.push(...makePreload(/^(common-)?app\..*\.js$/, 'script'));
          // roboto-latin-400.woff2 roboto-latin-300.woff2
          preloads.push(...makePreload(/^roboto-latin-[34]00\..*\.woff2$/, 'font'));
          // NotoSansSC-Regular-X.woff2 NotoSansSC-Light-X.woff2
          preloads.push(...makePreload(/^NotoSansSC-(Regular|Light)-X\..*\.woff2$/, 'font'));
          // NotoSansSC-Regular.woff2
          preloads.push(...makePrefetch(/^NotoSansSC-Regular\..*\.woff2$/));
          // *.chunk.js
          preloads.push(...makePrefetch(/\.chunk\.js$/));
          // *.worker.js
          preloads.push(...makePrefetch(/^.*\.worker\.js$/));
        }

        _.set(htmlPluginData, 'html', htmlPluginData.html.replace('</head>', `${preloads.join('\n')}</head>`));
        cb(null, htmlPluginData);
      });
    });
  }
}

module.exports = require('./webpack.base')({
  mode: 'production',

  // In production, we skip all hot-reloading stuff
  entry: {
    mock: [
      'file-loader?name=[name].[ext]!resource/favicon.ico',
      'file-loader?name=assets/[name].[ext]!outdatedbrowser/outdatedbrowser/outdatedbrowser.min.css',
    ],
    index: [
      'index/style.js',
      'index/index.js',
    ],
    app: [
      'root.js',
    ],
  },

  babelOptions: {
    plugins: [
      'lodash',
      [
        transformImports,
        {
          'material-ui': {
            transform: materialUiMap,
            preventFullImport: true,
          },
          'material-ui-icons': {
            // eslint-disable-next-line no-template-curly-in-string
            transform: 'material-ui-icons/${member}',
            preventFullImport: true,
          },
        },
      ],
    ],
  },

  workerName: 'assets/[chunkhash:8].worker.js',

  cssLoaderVender: extractCss1.extract({
    fallback: 'style-loader',
    use: [{
      loader: 'css-loader',
      options: {
        minimize: true,
        sourceMap: !!process.env.SOURCE_MAP,
      },
    }],
  }),
  cssLoaderApp: extractCss0.extract({
    fallback: 'style-loader',
    use: [{
      loader: 'css-loader',
      options: {
        minimize: true,
        sourceMap: !!process.env.SOURCE_MAP,
      },
    }],
  }),

  minify,
  inject: false,

  // Utilize long-term caching by adding content hashes (not compilation hashes) to compiled assets
  output: {
    filename: 'assets/[name].[chunkhash:8].js',
    chunkFilename: 'assets/[name].[chunkhash:8].chunk.js',
  },

  optimization: {
    concatenateModules: true,
    splitChunks: {
      minChunks: 4,
      name: false,
    },
    minimize: true,
    minimizer: [{
      apply: (compiler) => new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: !!process.env.SOURCE_MAP,
        uglifyOptions: {
          ecma: 8,
          compress: {
            // See UglifyJS bug [#2956](https://github.com/mishoo/UglifyJS2/issues/2956)
            inline: 1,
          },
          output: {
            comments: false,
          },
        },
      }).apply(compiler),
    }],
  },

  plugins: [
    new GitRevisionPlugin(),
    new BasicAssetsPlugin(),
    new NetlifyHttp2PushPlugin(),
    extractCss0,
    extractCss1,
  ],

  htmlPlugin: [
    new PreloadPlugin(),
  ],

  devtool: process.env.SOURCE_MAP ? 'source-map' : undefined,

  performance: {
    assetFilter: (assetFilename) => !(/(\.map$)|(^(favicon\.))/.test(assetFilename)),
  },
});
