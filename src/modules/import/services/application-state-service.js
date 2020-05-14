const applicationStateService = require('../../../lib/services/application-state');
const constants = require('../lib/constants');

const get = () => applicationStateService.get(constants.APPLICATION_STATE_KEY);

const save = (etag, isDownloaded = false) => applicationStateService.save(
  constants.APPLICATION_STATE_KEY,
  { etag, isDownloaded }
);

exports.get = get;
exports.save = save;
