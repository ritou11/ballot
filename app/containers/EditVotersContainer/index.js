import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';

import EditVotersPage from 'components/EditVotersPage';

import * as subscriptionContainerActions from 'containers/SubscriptionContainer/actions';
import * as editVotersContainerSelectors from './selectors';
import * as editVotersContainerActions from './actions';
import reducer from './reducer';
import sagas from './sagas';

export class EditVotersContainer extends React.PureComponent {
  componentWillMount() {
    this.props.onVoterRgRequestAction();
    if (this.props.match.params.bId !== _.get(this.props.ballot, 'bId')) {
      this.props.onRefresh();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps.match.params, this.props.match.params)) {
      nextProps.onRefresh();
      nextProps.onVoterRgRequestAction();
    }
  }

  componentWillUnmount() {
    this.props.onVoterRgStopAction();
  }

  render() {
    const {
      match,
      ...other
    } = this.props;

    return (
      <EditVotersPage
        bId={match.params.bId}
        {...other}
      />
    );
  }
}

EditVotersContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isCreateLoading: PropTypes.bool.isRequired,
  ballot: PropTypes.object,
  error: PropTypes.object,
  voters: PropTypes.array,
  onRefresh: PropTypes.func.isRequired,
  onCreateVoter: PropTypes.func.isRequired,
  onDeleteVoter: PropTypes.func.isRequired,
  onVoterRgRequestAction: PropTypes.func.isRequired,
  onVoterRgStopAction: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch, { match }) {
  const { bId } = match.params;
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: () => dispatch(editVotersContainerActions.votersRequest({ bId })),
    onVoterRgRequestAction: () => dispatch(subscriptionContainerActions.voterRgRequest({ bId })),
    onVoterRgStopAction: () => dispatch(subscriptionContainerActions.voterRgStop()),
    onCreateVoter: ({ name }) => dispatch(editVotersContainerActions.createVoterRequest({ bId, name })),
    onDeleteVoter: ({ iCode }) => dispatch(editVotersContainerActions.deleteVoterRequest({ bId, iCode })),
  };
}

const mapStateToProps = createStructuredSelector({
  hasCredential: (state) => !!state.getIn(['globalContainer', 'credential']),
  isLoading: (state) => state.getIn(['editVotersContainer', 'isLoading']),
  isCreateLoading: (state) => state.getIn(['editVotersContainer', 'isCreateLoading']),
  ballot: editVotersContainerSelectors.Ballot(),
  error: editVotersContainerSelectors.Error(),
  voters: editVotersContainerSelectors.Voters(),
});

export default compose(
  injectSaga({ key: 'editVotersContainer', saga: sagas }),
  injectReducer({ key: 'editVotersContainer', reducer }),
  connect(mapStateToProps, mapDispatchToProps),
)(EditVotersContainer);
