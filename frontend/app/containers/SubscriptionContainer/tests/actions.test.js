import * as SUBSCRIPTION_CONTAINER from '../constants';
import * as subscriptionContainerActions from '../actions';

describe('SubscriptionContainer actions', () => {
  // Actions
  describe('statusChange action', () => {
    const param = { bId: 'b', status: 's' };

    it('has a type of STATUS_CHANGE_ACTION', () => {
      expect(subscriptionContainerActions.statusChange(param).type).toEqual(SUBSCRIPTION_CONTAINER.STATUS_CHANGE_ACTION);
    });

    it('should forward', () => {
      expect(subscriptionContainerActions.statusChange(param).bId).toEqual('b');
      expect(subscriptionContainerActions.statusChange(param).status).toEqual('s');
    });
  });

  describe('statusRequest action', () => {
    const param = { bId: 'b', owner: 'o' };

    it('has a type of STATUS_REQUEST_ACTION', () => {
      expect(subscriptionContainerActions.statusRequest(param).type).toEqual(SUBSCRIPTION_CONTAINER.STATUS_REQUEST_ACTION);
    });

    it('should forward', () => {
      expect(subscriptionContainerActions.statusRequest(param).bId).toEqual('b');
      expect(subscriptionContainerActions.statusRequest(param).owner).toEqual('o');
    });
  });

  describe('statusStop action', () => {
    it('has a type of STATUS_STOP_ACTION', () => {
      expect(subscriptionContainerActions.statusStop().type).toEqual(SUBSCRIPTION_CONTAINER.STATUS_STOP_ACTION);
    });
  });

  describe('statusesRequest action', () => {
    it('has a type of STATUSES_REQUEST_ACTION', () => {
      expect(subscriptionContainerActions.statusesRequest().type).toEqual(SUBSCRIPTION_CONTAINER.STATUSES_REQUEST_ACTION);
    });
  });

  describe('statusesStop action', () => {
    it('has a type of STATUSES_STOP_ACTION', () => {
      expect(subscriptionContainerActions.statusesStop().type).toEqual(SUBSCRIPTION_CONTAINER.STATUSES_STOP_ACTION);
    });
  });

  describe('voterRgRequest action', () => {
    const param = { bId: 'b' };

    it('has a type of VOTER_RG_REQUEST_ACTION', () => {
      expect(subscriptionContainerActions.voterRgRequest(param).type).toEqual(SUBSCRIPTION_CONTAINER.VOTER_RG_REQUEST_ACTION);
    });

    it('should forward', () => {
      expect(subscriptionContainerActions.voterRgRequest(param).bId).toEqual('b');
    });
  });

  describe('voterRgStop action', () => {
    it('has a type of VOTER_RG_STOP_ACTION', () => {
      expect(subscriptionContainerActions.voterRgStop().type).toEqual(SUBSCRIPTION_CONTAINER.VOTER_RG_STOP_ACTION);
    });
  });

  describe('voterRegistered action', () => {
    const param = { iCode: 'c' };

    it('has a type of VOTER_REGISTERED_ACTION', () => {
      expect(subscriptionContainerActions.voterRegistered('b', param).type).toEqual(SUBSCRIPTION_CONTAINER.VOTER_REGISTERED_ACTION);
    });

    it('should forward', () => {
      expect(subscriptionContainerActions.voterRegistered('b', param).bId).toEqual('b');
      expect(subscriptionContainerActions.voterRegistered('b', param).voter).toEqual(param);
    });
  });
});
