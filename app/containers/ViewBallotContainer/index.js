import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createStructuredSelector } from 'reselect';
import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';

import ViewBallotPage from 'components/ViewBallotPage/Loadable';

import * as viewBallotContainerActions from './actions';
import reducer from './reducer';
import sagas from './sagas';

export class ViewBallotContainer extends React.PureComponent {
  render() {
    const {
      match,
      ballot,
      ...other
    } = this.props;

    return (
      <ViewBallotPage
        bId={match.params.bId}
        ballot={ballot && ballot.toJS()}
        {...other}
      />
    );
  }
}

ViewBallotContainer.propTypes = {
  onPush: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  ballot: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export function mapDispatchToProps(dispatch) {
  return {
    onPush: (url) => dispatch(push(url)),
    onRefresh: (bId) => dispatch(viewBallotContainerActions.ballotRequest(bId)),
  };
}

const mapStateToProps = createStructuredSelector({
  hasCredential: (state) => !!state.getIn(['globalContainer', 'credential']),
  isLoading: (state) => state.getIn(['viewBallotContainer', 'isLoading']),
  ballot: (state) => state.getIn(['viewBallotContainer', 'ballot']),
});

export default compose(
  injectSaga({ key: 'viewBallotContainer', saga: sagas }),
  injectReducer({ key: 'viewBallotContainer', reducer }),
  connect(mapStateToProps, mapDispatchToProps),
)(ViewBallotContainer);
