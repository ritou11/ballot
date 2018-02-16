import { call, put, select, takeEvery } from 'redux-saga/effects';
import * as api from 'utils/request';

import * as VIEW_BALLOT_CONTAINER from './constants';
import * as viewBallotContainerSelectors from './selectors';
import * as viewBallotContainerActions from './actions';
import gql from './api.graphql';

// Sagas
export function* handleBallotRequest({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));

  try {
    const result = yield call(api.query, gql.Ballot, { bId }, cred);
    yield put(viewBallotContainerActions.ballotSuccess(result));
  } catch (err) {
    yield put(viewBallotContainerActions.ballotFailure(err));
  }
}

export function* handleFinalizeRequest({ bId }) {
  const cred = yield select((state) => state.getIn(['globalContainer', 'credential', 'token']));
  const ballot = yield select(viewBallotContainerSelectors.Ballot());
  const { status } = ballot;

  let mutation;
  switch (status) {
    case 'inviting':
      mutation = gql.FinalizeVoters;
      break;
    case 'invited':
      mutation = gql.FinalizeFields;
      break;
    case 'preVoting':
      mutation = gql.FinalizePreVoting;
      break;
    case 'voting':
      mutation = gql.FinalizeVoting;
      break;
    default:
      yield put(viewBallotContainerActions.finalizeFailure({ codes: ['stna'] }));
      break;
  }

  try {
    const result = yield call(api.mutate, mutation, { bId }, cred);
    yield put(viewBallotContainerActions.finalizeSuccess(result));
    yield put(viewBallotContainerActions.ballotRequest({ bId }));
  } catch (err) {
    yield put(viewBallotContainerActions.finalizeFailure(err));
  }
}

// Watcher
/* eslint-disable func-names */
export default function* watcher() {
  yield takeEvery(VIEW_BALLOT_CONTAINER.BALLOT_REQUEST, handleBallotRequest);
  yield takeEvery(VIEW_BALLOT_CONTAINER.FINALIZE_REQUEST, handleFinalizeRequest);
}
