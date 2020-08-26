'use strict';

const repos = require('../../../lib/connectors/repos');

/**
 * Creates the required billing_batch_charge_versions for the given
 * Batch
 * @param {Batch} batch
 * @return {Promise<Array>} created rows (camel-cased)
 */
const createForBatch = batch => {
  const actions = {
    annual: repos.billingBatchChargeVersions.createAnnual,
    supplementary: repos.billingBatchChargeVersions.createSupplementary,
    two_part_tariff: repos.billingBatchChargeVersions.createTwoPartTariff
  };
  const params = {
    billingBatchId: batch.id,
    regionId: batch.region.id,
    fromFinancialYearEnding: batch.startYear.endYear,
    toFinancialYearEnding: batch.endYear.endYear,
    isSummer: batch.isSummer
  };
  return actions[batch.type](params);
};

exports.createForBatch = createForBatch;
