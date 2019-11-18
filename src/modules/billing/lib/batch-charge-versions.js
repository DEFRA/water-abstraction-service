const { range } = require('lodash');
const { batchStatus } = require('./batch');

/**
 * For a given batch and it's associated charge versions, this function will return
 * a copy of the charge version ready to persist in water.billing_batch_charge_version_years
 * for each financial year that the batch spans. For example for annual billing this would
 * be a one to one mapping but for supplementary this could mean that each incoming charge version
 * is mapped to six new charge version years.
 *
 * @param {Object} batch The batch that is being processed
 * @param {Array} batchChargeVersions The charge versions that have been mapped to the batch
 */
const createChargeVersionYears = (batch, batchChargeVersions) => {
  const years = range(batch.start_financial_year, batch.end_financial_year + 1);
  return batchChargeVersions.reduce((acc, batchChargeVersion) => {
    return [
      ...acc,
      ...years.map(year => ({
        billing_batch_id: batchChargeVersion.billing_batch_id,
        charge_version_id: batchChargeVersion.charge_version_id,
        financial_year: year,
        status: batchStatus.processing
      }))
    ];
  }, []);
};

exports.createChargeVersionYears = createChargeVersionYears;
