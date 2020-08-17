const camelCaseKeys = require('../../../lib/camel-case-keys');
const FinancialYear = require('../../../lib/models/financial-year');
const validators = require('../../../lib/models/validators');
const Batch = require('../../../lib/models/batch');
const { BATCH_STATUS } = require('../../../lib/models/batch');

const batchService = require('./batch-service');
const chargeProcessorService = require('./charge-processor-service');

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

/**
 * Process a single charge version year, and return the batch
 * with the invoice generated
 * @param {Object} chargeVersionYear
 * @return {Batch}
 */
const processChargeVersionYear = async dbRow => {
  const chargeVersionYear = camelCaseKeys(dbRow);
  const batch = await batchService.getBatchById(chargeVersionYear.billingBatchId);
  const financialYear = new FinancialYear(chargeVersionYear.financialYearEnding);
  const invoice = await chargeProcessorService.processChargeVersionYear(batch, financialYear, chargeVersionYear.chargeVersionId);
  batch.invoices = [invoice];
  return batch;
};

const createForBatch = batch =>
  repos.billingBatchChargeVersionYears.createForBatch(batch.id);

/**
 * Gets all charge version year records for given batch
 * @param {String} batchId
 * @return {Promise<Array>}
 */
const getForBatch = batchId => {
  return repos.billingBatchChargeVersionYears.findByBatchId(batchId);
};

/**
 * Gets all charge version year records for given batch where there
 * is a two-part tariff agreement in place
 * @param {String} batchId
 * @return {Promise<Array>}
 */
const getTwoPartTariffForBatch = batchId => {
  return repos.billingBatchChargeVersionYears.findTwoPartTariffByBatchId(batchId);
};

const createBatchChargeVersionYear = (batch, chargeVersionId, financialYear) => {
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertId(chargeVersionId);
  validators.assertIsInstanceOf(financialYear, FinancialYear);
  return repos.billingBatchChargeVersionYears.create(
    batch.id, chargeVersionId, financialYear.endYear, BATCH_STATUS.processing
  );
};

exports.setReadyStatus = setReadyStatus;
exports.setErrorStatus = setErrorStatus;
exports.getStatusCounts = getStatusCounts;
exports.processChargeVersionYear = processChargeVersionYear;
exports.createForBatch = createForBatch;
exports.getForBatch = getForBatch;
exports.getTwoPartTariffForBatch = getTwoPartTariffForBatch;
exports.createBatchChargeVersionYear = createBatchChargeVersionYear;
