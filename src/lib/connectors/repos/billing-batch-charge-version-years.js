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
 */
const deleteByBatchId = async batchId => BillingBatchChargeVersionYear
  .forge()
  .where({ billing_batch_id: batchId })
  .destroy({ require: false });

/*
  * Deletes all charge version years associated with an invoice ID
  * @param {String} billingInvoiceId
  * @return {Promise}
  */
const deleteByInvoiceId = billingInvoiceId => bookshelf
  .knex
  .raw(queries.deleteByInvoiceId, { billingInvoiceId });

/**
 * Creates water.billing_batchcharge_version_year records for given batch ID
 * This assumes water.billing_batch_charge_versions is already populated
 * @param {String} billingBatchId
 */
const createForBatch = billingBatchId =>
  raw.multiRow(queries.createForBatch, { billingBatchId });

exports.update = update;
exports.findStatusCountsByBatchId = findStatusCountsByBatchId;
exports.deleteByBatchId = deleteByBatchId;
exports.deleteByInvoiceId = deleteByInvoiceId;
exports.createForBatch = createForBatch;
