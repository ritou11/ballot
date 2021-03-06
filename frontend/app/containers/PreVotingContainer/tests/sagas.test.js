import { fromJS } from 'immutable';
import { expectSaga } from 'redux-saga-test-plan';
import { throwError } from 'redux-saga-test-plan/providers';
import * as matchers from 'redux-saga-test-plan/matchers';
import * as api from 'utils/request';
import { initialize } from 'redux-form';
import { signMessage } from 'utils/crypto';

import * as SUBSCRIPTION_CONTAINER from 'containers/SubscriptionContainer/constants';
import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as PRE_VOTING_CONTAINER from '../constants';
import * as preVotingContainerActions from '../actions';
import gql from '../api.graphql';

import watcher, {
  makeChan,
  handleRefreshRequest,
  handleSignRequest,
  handleStatusRequest,
} from '../sagas';

jest.mock('utils/crypto', () => ({
  signMessage: jest.fn(),
}));

// Sagas
describe('handleRefreshRequest Saga', () => {
  const variables = { bId: 'val' };
  const func = () => handleRefreshRequest(variables);
  const dArgs = [api.query, gql.Refresh, variables];

  // eslint-disable-next-line arrow-body-style
  it('should listen REFRESH_REQUEST in the watcher', () => {
    return expectSaga(watcher)
      .take(PRE_VOTING_CONTAINER.REFRESH_REQUEST)
      .silentRun();
  });

  it('should dispatch refreshSuccess', () => {
    const fields = [
      { __typename: 'StringField', default: 'v' },
      { __typename: 'EnumField', items: ['x'] },
    ];
    const response = { ballot: { fields } };

    return expectSaga(func)
      .call(...dArgs)
      .provide([
        [matchers.call(...dArgs), response],
      ])
      .put(preVotingContainerActions.refreshSuccess(response))
      .put(initialize('preVotingForm', { 0: 'v', 1: undefined }, {
        updateUnregisteredFields: true,
      }))
      .run();
  });

  it('should dispatch refreshFailure', () => {
    const error = new Error('value');

    return expectSaga(func)
      .call(...dArgs)
      .provide([
        [matchers.call(...dArgs), throwError(error)],
      ])
      .put(preVotingContainerActions.refreshFailure(error))
      .run();
  });
});

describe('handleSignRequest Saga', () => {
  const variables = { payload: 'val', privateKey: 'pv' };
  const ballot = { q: 'q', g: 'g', h: 'h' };
  const state = fromJS({
    preVotingContainer: {
      ballot: {
        ...ballot,
        voters: [
          { publicKey: 'k1' },
          { publicKey: 'k2' },
        ],
      },
    },
  });
  const func = () => handleSignRequest(variables);
  const vars = {
    ...ballot,
    x: 'pv',
    ys: ['k1', 'k2'],
  };
  const dArgs = [makeChan, signMessage, 'val', vars];

  // eslint-disable-next-line arrow-body-style
  it('should listen SIGN_REQUEST in the watcher', () => {
    return expectSaga(watcher)
      .take(PRE_VOTING_CONTAINER.SIGN_REQUEST)
      .silentRun();
  });

  it('should dispatch signProgress', () => {
    signMessage.mockImplementationOnce((progress) => new Promise((resolve) => {
      process.nextTick(() => {
        progress(1);
        progress(2);
        resolve({});
      });
    }));

    return expectSaga(func)
      .withState(state)
      .call(...dArgs)
      .put(preVotingContainerActions.signProgress(1))
      .put(preVotingContainerActions.signProgress(2))
      .put(preVotingContainerActions.signSuccess({}))
      .run();
  });

  it('should dispatch signSuccess', () => {
    const sign = 'resp';
    const response = { sign };
    signMessage.mockImplementationOnce(() => Promise.resolve(response));

    return expectSaga(func)
      .withState(state)
      .call(...dArgs)
      .put(preVotingContainerActions.signSuccess(response))
      .run();
  });

  it('should dispatch signFailure', () => {
    const error = new Error('value');
    signMessage.mockImplementationOnce(() => Promise.reject(error));

    return expectSaga(func)
      .withState(state)
      .call(...dArgs)
      .put(preVotingContainerActions.signFailure(error))
      .run();
  });
});

// Subscriptions
describe('handleStatusRequest', () => {
  const state = fromJS({
    preVotingContainer: {
      ballot: { bId: 'b', owner: 'o' },
    },
  });
  const func = handleStatusRequest;

  // eslint-disable-next-line arrow-body-style
  it('should listen STATUS_REQUEST_ACTION in the watcher', () => {
    return expectSaga(watcher)
      .take(PRE_VOTING_CONTAINER.STATUS_REQUEST_ACTION)
      .silentRun();
  });

  // eslint-disable-next-line arrow-body-style
  it('should not dispatch if no ballot', () => {
    return expectSaga(func)
      .withState(state.setIn(['preVotingContainer', 'ballot'], undefined))
      .not.put.actionType(SUBSCRIPTION_CONTAINER.STATUS_REQUEST_ACTION)
      .run();
  });

  it('should dispatch statusRequest', () => {
    const response = { bId: 'b', owner: 'o' };

    return expectSaga(func)
      .withState(state)
      .put(subscriptionContainerActions.statusRequest(response))
      .run();
  });
});
