const repos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');

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

/**
 * Gets charge version by ID
 * @param {String} chargeVersionId
 * @return {Promise<ChargeVersion>}
 */
const getByChargeVersionId = async chargeVersionId => {
  // Fetch DB data
  const data = await repos.chargeVersions.findOne(chargeVersionId);
  return mappers.chargeVersion.dbToModel(data);
};

exports.createForBatch = createForBatch;
exports.getByChargeVersionId = getByChargeVersionId;
