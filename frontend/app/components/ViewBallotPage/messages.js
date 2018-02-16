import { defineMessages } from 'react-intl';
import messages from 'utils/messages';

export default {
  ...messages,
  ...defineMessages({
    fields: {
      id: 'app.components.ViewBallotPage.fields',
      defaultMessage: 'Fields',
    },
    voters: {
      id: 'app.components.ViewBallotPage.voters',
      defaultMessage: 'Voters',
    },
    preVoting: {
      id: 'app.components.ViewBallotPage.preVoting',
      defaultMessage: 'Pre-voting',
    },
    voting: {
      id: 'app.components.ViewBallotPage.voting',
      defaultMessage: 'Voting',
    },
    stats: {
      id: 'app.components.ViewBallotPage.stats',
      defaultMessage: 'Statistics',
    },
    count: {
      id: 'app.components.ViewBallotPage.count',
      defaultMessage: 'Submitted:',
    },
    registered: {
      id: 'app.components.ViewBallotPage.registered',
      defaultMessage: 'Registered',
    },
    unregistered: {
      id: 'app.components.ViewBallotPage.unregistered',
      defaultMessage: 'Not registered',
    },
    finalizeVoters: {
      id: 'app.components.ViewBallotPage.finalizeVoters',
      defaultMessage: 'Stop inviting',
    },
    finalizeFields: {
      id: 'app.components.ViewBallotPage.finalizeFields',
      defaultMessage: 'Start pre voting',
    },
    finalizePreVoting: {
      id: 'app.components.ViewBallotPage.finalizePreVoting',
      defaultMessage: 'Start voting',
    },
    finalizeVoting: {
      id: 'app.components.ViewBallotPage.finalizeVoting',
      defaultMessage: 'Stop voting',
    },
    export: {
      id: 'app.components.ViewBallotPage.export',
      defaultMessage: 'Export Crypto',
    },
  }),
};
