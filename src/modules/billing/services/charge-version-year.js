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

/**
 * Gets the number of water.billing_batch_charge_version_years in each status
 * @param {String} batchId
 * @return {Object} { ready, error, processing }
 */
const getStatusCounts = async batchId => {
  const data = await repos.billingBatchChargeVersionYears.findStatusCountsByBatchId(batchId);
  return data.reduce((acc, row) => ({
    ...acc,
    [row.status]: parseInt(row.count)
  }), { ready: 0, error: 0, processing: 0 });
};

exports.setReadyStatus = setReadyStatus;
exports.setErrorStatus = setErrorStatus;
exports.getStatusCounts = getStatusCounts;
