const repos = require('../../../lib/connectors/repos');
const { CHARGE_VERSION_YEAR_STATUS } = require('../../../lib/models/charge-version-year.js');

/**
 * Sets water.billing_batch_charge_version_years to "ready"
 * @param {String} id
 * @return {Promise}
 */
const setReadyStatus = id =>
  repos.billingBatchChargeVersionYears.update(id, { status: CHARGE_VERSION_YEAR_STATUS.ready });

/**
 * Sets water.billing_batch_charge_version_years to "error"
 * @param {String} id
 * @return {Promise}
 */
const setErrorStatus = id =>
  repos.billingBatchChargeVersionYears.update(id, { status: CHARGE_VERSION_YEAR_STATUS.error });

exports.setReadyStatus = setReadyStatus;
exports.setErrorStatus = setErrorStatus;
