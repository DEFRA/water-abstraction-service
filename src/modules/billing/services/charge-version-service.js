const repos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');

const crmV2Connector = require('../../../lib/connectors/crm-v2');

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
 * including loading CRM company and invoice account data
 * @param {String} chargeVersionId
 * @return {Promise<ChargeVersion>}
 */
const getByChargeVersionId = async chargeVersionId => {
  // Fetch DB data
  const data = await repos.chargeVersions.findOne(chargeVersionId);

  // Get CRM data
  const [company, invoiceAccount] = await Promise.all([
    crmV2Connector.companies.getCompany(data.companyId),
    crmV2Connector.invoiceAccounts.getInvoiceAccountById(data.invoiceAccountId)
  ]);

  // Map to service model
  const chargeVersion = mappers.chargeVersion.dbToModel(data);
  return chargeVersion.fromHash({
    company: mappers.company.crmToModel(company),
    invoiceAccount: mappers.invoiceAccount.crmToModel(invoiceAccount)
  });
};

exports.createForBatch = createForBatch;
exports.getByChargeVersionId = getByChargeVersionId;
