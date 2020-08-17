'use strict';

const { BillingBatchChargeVersionYear, bookshelf } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/billing-batch-charge-version-years');

const update = (id, data) =>
  BillingBatchChargeVersionYear
    .forge({ billingBatchChargeVersionYearId: id })
    .save(data);

/**
 * Gets a count of the charge version years in each status by batch ID
 * @param {String} batchId - guid
 */
const findStatusCountsByBatchId = batchId =>
  raw.multiRow(queries.findStatusCountsByBatchId, { batchId });

/**
 * Deletes all billing batch charge version years for given batch
 * @param {String} batchId - guid
 * @param {String} isDeletionRequired - boolean
 */
const deleteByBatchId = async (batchId, isDeletionRequired = true) => BillingBatchChargeVersionYear
  .forge()
  .where({ billing_batch_id: batchId })
  .destroy({ require: isDeletionRequired });

/*
  * Deletes all charge version years associated with an invoice ID
  * @param {String} billingInvoiceId
  * @return {Promise}
  */
const deleteByInvoiceId = billingInvoiceId => bookshelf
  .knex
  .raw(queries.deleteByInvoiceId, { billingInvoiceId });

/**
 * Finds all charge version years for the supplied batch ID
 * @param {String} billingBatchId
 */
const findByBatchId = async billingBatchId => {
  const collection = await BillingBatchChargeVersionYear
    .collection()
    .where('billing_batch_id', billingBatchId)
    .fetch();
  return collection.toJSON();
};

/**
 * Finds water.billing_batch_charge_version_years records in batch where
 * a two-part tariff agreement applies
 * @param {String} billingBatchId
 * @return {Promise<Array>}
 */
const findTwoPartTariffByBatchId = billingBatchId => bookshelf
  .knex
  .raw(queries.findTwoPartTariffByBatchId, { billingBatchId });

/**
 * Deletes charge versiom years in a batch for a particular licence ID
 * @param {String} billingBatchId
 * @param {String} licenceId
 */
const deleteByBatchIdAndLicenceId = (billingBatchId, licenceId) =>
  bookshelf.knex.raw(queries.deleteByBatchIdAndLicenceId, { billingBatchId, licenceId });

/**
 * Creates a new record in water.billing_batch_charge_version_years
 * @param {String} billingBatchId
 * @param {String} chargeVersionId
 * @param {Number} financialYearEnding
 * @param {String} status
 */
const create = (billingBatchId, chargeVersionId, financialYearEnding, status) => {
  const model = BillingBatchChargeVersionYear
    .forge({
      billingBatchId,
      chargeVersionId,
      financialYearEnding,
      status
    })
    .save();
  return model.toJSON();
};

exports.update = update;
exports.findStatusCountsByBatchId = findStatusCountsByBatchId;
exports.deleteByBatchId = deleteByBatchId;
exports.deleteByInvoiceId = deleteByInvoiceId;
exports.findByBatchId = findByBatchId;
exports.findTwoPartTariffByBatchId = findTwoPartTariffByBatchId;
exports.deleteByBatchIdAndLicenceId = deleteByBatchIdAndLicenceId;
exports.create = create;
