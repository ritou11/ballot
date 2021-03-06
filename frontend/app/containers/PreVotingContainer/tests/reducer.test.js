import { fromJS } from 'immutable';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as preVotingContainerActions from '../actions';
import preVotingContainerReducer, {
  normalizeFields,
} from '../reducer';

jest.mock('shortid', () => ({
  generate: () => 'id',
}));

describe('normalizeFields', () => {
  it('shuold parse string field', () => {
    const result = normalizeFields([
      { __typename: 'StringField', default: 'def' },
    ]);
    expect(result).toEq([
      { type: 'StringField', key: 'id', default: 'def' },
    ]);
  });

  it('shuold parse enum field', () => {
    const result = normalizeFields([
      { __typename: 'EnumField', items: ['def'] },
    ]);
    expect(result).toEq([
      { type: 'EnumField', key: 'id', items: ['def'] },
    ]);
  });

  it('should throw unsupported', () => {
    expect(() => normalizeFields([{ __typename: 'unk' }])).toThrow();
  });
});

describe('preVotingContainerReducer', () => {
  let state;
  beforeEach(() => {
    state = fromJS({
      isLoading: false,
      isSignLoading: false,
      ballot: null,
      fields: null,
      error: null,
      ticket: null,
      progress: null,
    });
  });

  it('should return the initial state', () => {
    const expectedResult = state;
    expect(preVotingContainerReducer(undefined, {})).toEq(expectedResult);
  });

  // Actions
  it('should handle valid subscription status change action', () => {
    const originalState = state.set('ballot', fromJS({
      bId: 'b',
      status: 's',
      evil: true,
    }));
    const param = { bId: 'b', status: 'x' };
    const expectedResult = state.set('ballot', fromJS({
      bId: 'b',
      status: 'x',
      evil: true,
    }));

    expect(preVotingContainerReducer(originalState, subscriptionContainerActions.statusChange(param))).toEq(expectedResult);
  });

  it('should handle invalid subscription status change action', () => {
    const originalState = state.set('ballot', fromJS({
      bId: 'b',
      status: 's',
      evil: true,
    }));
    const param = { bId: 'x', status: 'x' };
    const expectedResult = state.set('ballot', fromJS({
      bId: 'b',
      status: 's',
      evil: true,
    }));

    expect(preVotingContainerReducer(originalState, subscriptionContainerActions.statusChange(param))).toEq(expectedResult);
  });

  it('should handle signProgress action', () => {
    const originalState = state;
    const expectedResult = state.set('progress', 666);

    expect(preVotingContainerReducer(originalState, preVotingContainerActions.signProgress(666))).toEq(expectedResult);
  });

  // Sagas
  it('should handle refresh request', () => {
    const originalState = state
      .set('progress', 666)
      .set('isLoading', false)
      .set('error', 'e')
      .set('ticket', 't');
    const param = { bId: 'val' };
    const expectedResult = state.set('isLoading', true);

    expect(preVotingContainerReducer(originalState, preVotingContainerActions.refreshRequest(param))).toEq(expectedResult);
  });

  it('should handle refresh success', () => {
    const originalState = state.set('isLoading', true);
    const ballot = {
      bId: 'b',
      name: 'n',
      owner: 'o',
      status: 's',
      q: 'q',
      g: 'g',
      h: 'h',
    };
    const result = {
      ballot: {
        ...ballot,
        fields: [
          { __typename: 'StringField', prompt: 'p1' },
          { __typename: 'EnumField', prompt: 'p2', items: ['v'] },
        ],
      },
    };
    const expectedResult = state.set('isLoading', false)
      .set('ballot', fromJS(ballot))
      .set('fields', fromJS([
        {
          type: 'StringField',
          key: 'id',
          prompt: 'p1',
        },
        {
          type: 'EnumField',
          key: 'id',
          prompt: 'p2',
          items: ['v'],
        },
      ]));

    expect(preVotingContainerReducer(originalState, preVotingContainerActions.refreshSuccess(result))).toEq(expectedResult);
  });

  it('should handle refresh success error', () => {
    const originalState = state.set('isLoading', true);
    const result = {
      ballot: {
        fields: [
          { __typename: 'unknown' },
        ],
      },
    };
    const expectedResult = state.set('isLoading', false)
      .set('error', { codes: ['tpns'] });

    expect(preVotingContainerReducer(originalState, preVotingContainerActions.refreshSuccess(result))).toEq(expectedResult);
  });

  it('should handle refresh failure', () => {
    const originalState = state.set('isLoading', true);
    const error = { key: 'value' };
    const expectedResult = state.set('isLoading', false)
      .set('error', fromJS(error));

    expect(preVotingContainerReducer(originalState, preVotingContainerActions.refreshFailure(error))).toEq(expectedResult);
  });

  it('should handle sign request', () => {
    const originalState = state.set('isSignLoading', false);
    const param = { payload: 'val' };
    const expectedResult = state.set('isSignLoading', true).set('progress', 0);

    expect(preVotingContainerReducer(originalState, preVotingContainerActions.signRequest(param))).toEq(expectedResult);
  });

  it('should handle sign success', () => {
    const originalState = state.set('isSignLoading', true).set('progress', 1);
    const result = { key: 'value' };
    const expectedResult = state.set('isSignLoading', false)
      .set('ticket', fromJS(result));

    expect(preVotingContainerReducer(originalState, preVotingContainerActions.signSuccess(result))).toEq(expectedResult);
  });

  it('should handle sign failure', () => {
    const originalState = state.set('isSignLoading', true);
    const error = { };
    const expectedResult = state.set('isSignLoading', false);

    expect(preVotingContainerReducer(originalState, preVotingContainerActions.signFailure(error))).toEq(expectedResult);
  });
});
