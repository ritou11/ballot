import * as VIEW_STAT_CONTAINER from './constants';

// Actions
export function changeField(index) {
  return {
    type: VIEW_STAT_CONTAINER.CHANGE_FIELD_ACTION,
    index,
  };
}

// Sagas
export function ballotRequest({ bId }) {
  return {
    type: VIEW_STAT_CONTAINER.BALLOT_REQUEST,
    bId,
  };
}

export function ballotSuccess(result) {
  return {
    type: VIEW_STAT_CONTAINER.BALLOT_SUCCESS,
    result,
  };
}

export function ballotFailure(error) {
  return {
    type: VIEW_STAT_CONTAINER.BALLOT_FAILURE,
    error,
  };
}

export function statsRequest({ bId, max }) {
  return {
    type: VIEW_STAT_CONTAINER.STATS_REQUEST,
    bId,
    max,
  };
}

export function statsSuccess(results) {
  return {
    type: VIEW_STAT_CONTAINER.STATS_SUCCESS,
    results,
  };
}

export function statsFailure(error) {
  return {
    type: VIEW_STAT_CONTAINER.STATS_FAILURE,
    error,
  };
}
