const newRepos = require('../../../lib/connectors/repos');
const { CHARGE_VERSION_YEAR_STATUS } = require('../../../lib/models/charge-version-year.js');

const setReadyStatus = id =>
  newRepos.billingBatchChargeVersionYears.setStatus(id, CHARGE_VERSION_YEAR_STATUS.ready);

const setErrorStatus = id =>
  newRepos.billingBatchChargeVersionYears.setStatus(id, CHARGE_VERSION_YEAR_STATUS.error);

exports.setReadyStatus = setReadyStatus;
exports.setErrorStatus = setErrorStatus;
