const { BillingBatchChargeVersion, bookshelf } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/billing-batch-charge-versions');

/**
 * Deletes all billing batch charge versions for given batch
 * @param {String} batchId - guid
 * @param {String} isDeletionRequired - boolean
 */
const deleteByBatchId = async (batchId, isDeletionRequired = true) => BillingBatchChargeVersion
  .forge()
  .where({ billing_batch_id: batchId })
  .destroy({ require: isDeletionRequired });

/**
 * Deletes charge versiom years in a batch for a particular licence ID
 * @param {String} billingBatchId
 * @param {String} licenceId
 */
const deleteByBatchIdAndLicenceId = (billingBatchId, licenceId) =>
  bookshelf.knex.raw(queries.deleteByBatchIdAndLicenceId, { billingBatchId, licenceId });

/**
 * Creates a charge version for the billing batch
 * @param {String} billingBatchId
 * @param {String} chargeVersionId
 * @return {Promise<Object>} new water.billing_batch_charge_versions row
 */
const create = (billingBatchId, chargeVersionId) =>
  raw.singleRow(queries.create, { billingBatchId, chargeVersionId });

exports.deleteByBatchId = deleteByBatchId;
exports.deleteByBatchIdAndLicenceId = deleteByBatchIdAndLicenceId;
exports.create = create;
