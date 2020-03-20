const repos = require('../../../lib/connectors/repos');

const actions = {
  annual: repos.billingBatchChargeVersions.createAnnual,
  supplementary: repos.billingBatchChargeVersions.createSupplementary,
  two_part_tariff: repos.billingBatchChargeVersions.createTwoPartTariff
};

/**
 * Creates the required billing_batch_charge_versions for the given
 * Batch
 * @param {Batch} batch
 * @return {Promise<Array>} created rows (camel-cased)
 */
const createForBatch = batch => {
  const params = {
    billingBatchId: batch.id,
    regionId: batch.region.id,
    fromFinancialYearEnding: batch.startYear.endYear,
    toFinancialYearEnding: batch.endYear.endYear,
    season: batch.season
  };
  return actions[batch.type](params);
};

exports.createForBatch = createForBatch;
