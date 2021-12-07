'use strict';

const FinancialYear = require('../../../lib/models/financial-year');
const validators = require('../../../lib/models/validators');
const mappers = require('../mappers');
const Batch = require('../../../lib/models/batch');
const { BATCH_STATUS } = require('../../../lib/models/batch');

const chargeProcessorService = require('./charge-processor-service');

const repos = require('../../../lib/connectors/repos');
const { CHARGE_VERSION_YEAR_STATUS, TRANSACTION_TYPE } = require('../../../lib/models/charge-version-year.js');

/**
 * Gets charge version year for given id
 * @param {String} id
 * @return {Promise}
 */
const getChargeVersionYearById = async id => {
  const row = await repos.billingBatchChargeVersionYears.findOne(id);
  return row ? mappers.chargeVersionYear.dbToModel(row) : null;
};

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
const processChargeVersionYear = async chargeVersionYear => {
  const { batch, isChargeable } = chargeVersionYear;
  if (isChargeable) {
    const invoice = await chargeProcessorService.processChargeVersionYear(chargeVersionYear);
    batch.invoices = [invoice];
  }
  return batch;
};

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
  return repos.billingBatchChargeVersionYears.findTwoPartTariffByBatchId(batchId, false);
};

/**
 * Creates a new row in water.billing_batch_charge_version_years
 * @param {Batch} batch
 * @param {String} chargeVersionId
 * @param {FinancialYear} financialYear
 * @return {Promise}
 */
const createBatchChargeVersionYear = (batch, chargeVersionId, financialYear, transactionType, isSummer, hasTwoPartAgreement, isChargeable = true) => {
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertId(chargeVersionId);
  validators.assertIsInstanceOf(financialYear, FinancialYear);
  validators.assertEnum(transactionType, Object.values(TRANSACTION_TYPE));
  validators.assertIsBoolean(isSummer);
  validators.assertIsBoolean(hasTwoPartAgreement);
  validators.assertIsBoolean(isChargeable);
  return repos.billingBatchChargeVersionYears.create({
    billingBatchId: batch.id,
    chargeVersionId: chargeVersionId,
    financialYearEnding: financialYear.endYear,
    status: BATCH_STATUS.processing,
    transactionType,
    isSummer,
    hasTwoPartAgreement,
    isChargeable
  });
};

/**
 * @param {String} batchId
 * @param {String} licenceId
 * @param {Number} financialYearEnding
 * @type {(function(*, *, *): Knex.Raw<TResult>)|*}
 */
const deleteChargeVersionYear = repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceIdAndFinancialYearEnding;

exports.getChargeVersionYearById = getChargeVersionYearById;
exports.setReadyStatus = setReadyStatus;
exports.setErrorStatus = setErrorStatus;
exports.getStatusCounts = getStatusCounts;
exports.processChargeVersionYear = processChargeVersionYear;
exports.getForBatch = getForBatch;
exports.getTwoPartTariffForBatch = getTwoPartTariffForBatch;
exports.createBatchChargeVersionYear = createBatchChargeVersionYear;
exports.deleteChargeVersionYear = deleteChargeVersionYear;
