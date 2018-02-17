import * as VIEW_BALLOT_CONTAINER from './constants';

// Actions
export function voterRgRequest({ bId }) {
  return {
    type: VIEW_BALLOT_CONTAINER.VOTER_RG_REQUEST_ACTION,
    bId,
  };
}

export function voterRgStop() {
  return {
    type: VIEW_BALLOT_CONTAINER.VOTER_RG_STOP_ACTION,
  };
}

export function voterRegistered({ bId, iCode }) {
  return {
    type: VIEW_BALLOT_CONTAINER.VOTER_REGISTERED_ACTION,
    bId,
    iCode,
  };
}

// Sagas
export function ballotRequest({ bId }) {
  return {
    type: VIEW_BALLOT_CONTAINER.BALLOT_REQUEST,
    bId,
  };
}

export function ballotSuccess(result) {
  return {
    type: VIEW_BALLOT_CONTAINER.BALLOT_SUCCESS,
    result,
  };
}

export function ballotFailure(error) {
  return {
    type: VIEW_BALLOT_CONTAINER.BALLOT_FAILURE,
    error,
  };
}

export function finalizeRequest({ bId }) {
  return {
    type: VIEW_BALLOT_CONTAINER.FINALIZE_REQUEST,
    bId,
  };
}

export function finalizeSuccess(result) {
  return {
    type: VIEW_BALLOT_CONTAINER.FINALIZE_SUCCESS,
    result,
  };
}

export function finalizeFailure(error) {
  return {
    type: VIEW_BALLOT_CONTAINER.FINALIZE_FAILURE,
    error,
  };
}

export function exportRequest({ bId }) {
  return {
    type: VIEW_BALLOT_CONTAINER.EXPORT_REQUEST,
    bId,
  };
}

export function exportSuccess(result) {
  return {
    type: VIEW_BALLOT_CONTAINER.EXPORT_SUCCESS,
    result,
  };
}

export function exportFailure(error) {
  return {
    type: VIEW_BALLOT_CONTAINER.EXPORT_FAILURE,
    error,
  };
}
