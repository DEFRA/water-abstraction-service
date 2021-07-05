'use strict';

const { bookshelf, BillingInvoice } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/billing-invoices');
const helpers = require('./lib/helpers');
const paginationHelper = require('./lib/envelope');

/**
 * Upserts a water.billing_invoices record
 * @param {Object} data - camel case
 */
const upsert = async data => raw.singleRow(queries.upsert, data);

/**
 * Deletes invoices in the batch which have no invoice licences
 * @param {String} batchId
 */
const deleteEmptyByBatchId = batchId =>
  bookshelf.knex.raw(queries.deleteEmptyByBatchId, { batchId });

/**
 * Finds an invoice with related model data by ID
 * @param {String} id
 */
const findOne = async id => {
  const model = await BillingInvoice
    .forge({ billingInvoiceId: id })
    .fetch({
      require: false,
      withRelated: [
        'billingBatch',
        'billingBatch.region',
        'billingInvoiceLicences',
        'billingInvoiceLicences.licence',
        'billingInvoiceLicences.licence.region',
        'billingInvoiceLicences.billingTransactions',
        'billingInvoiceLicences.billingTransactions.billingVolume',
        'billingInvoiceLicences.billingTransactions.chargeElement',
        'billingInvoiceLicences.billingTransactions.chargeElement.purposeUse',
        'linkedBillingInvoices'
      ]
    });

  return model ? model.toJSON() : null;
};

const findOneBy = conditions =>
  helpers.findOneBy(BillingInvoice, conditions);

/**
 * Delete a single record by ID
 * @param {String} id - one or many IDs
 */
const deleteRecord = billingInvoiceId => BillingInvoice
  .forge({ billingInvoiceId })
  .destroy();

/**
* Deletes all billing invoice licences for given batch
* @param {String} batchId - guid
* @param {String} isDeletionRequired - boolean
*/
const deleteByBatchId = async (batchId, isDeletionRequired = true) => BillingInvoice
  .forge()
  .where({ billing_batch_id: batchId })
  .destroy({ require: isDeletionRequired });

const update = async (billingInvoiceId, changes) =>
  helpers.update(BillingInvoice, 'billingInvoiceId', billingInvoiceId, changes);

/**
* Gets BillingInvoices and related models for an invoice account by invoiceAccountId
* where the batch is sent
* @param {String} invoiceAccountId
* @param {number} page
* @param {number} perPage
* @return {Promise<Object>}
*/
const findAllForInvoiceAccount = async (invoiceAccountId, page = 1, perPage = 10) => {
  const result = await BillingInvoice
    .forge()
    .query(function (qb) {
      qb.join('water.billing_batches', 'water.billing_invoices.billing_batch_id', '=', 'water.billing_batches.billing_batch_id');
      qb.where({ invoice_account_id: invoiceAccountId, 'water.billing_batches.status': 'sent' });
      qb.orderBy('date_created', 'DESC', 'water.billing_invoices.financial_year_ending', 'DESC');
    })
    .fetchPage({
      pageSize: perPage,
      page: page,
      withRelated: [
        'billingInvoiceLicences',
        'billingBatch',
        'billingBatch.region'
      ]
    });

  return paginationHelper.paginatedEnvelope(result);
};

/**
 * Finds invoices flagged for rebilling in the given region
 * @param {String} regionId
 * @returns {Promise<Array>}
 */
const findByIsFlaggedForRebillingAndRegion = regionId =>
  raw.multiRow(queries.findByIsFlaggedForRebillingAndRegion, { regionId });

/**
 * Resets rebilling flags for invoices relating to the supplied
 * batch Id.
 * Note: the invoices themselves are not in this batch
 *
 * @param {String} batchId
 * @return {Promise}
 */
const resetIsFlaggedForRebilling = batchId =>
  raw.multiRow(queries.resetIsFlaggedForRebilling, { batchId });

/**
 * Deletes rebilled invoices by originalInvoiceId
 * @param {String} originalBillingInvoiceId
 */
const deleteInvoicesByOriginalInvoiceId = originalBillingInvoiceId =>
  bookshelf.knex.raw(queries.deleteByOriginalInvoiceId, { originalBillingInvoiceId });

const create = data =>
  helpers.create(BillingInvoice, data);

exports.deleteInvoicesByOriginalInvoiceId = deleteInvoicesByOriginalInvoiceId;
exports.upsert = upsert;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
exports.findOne = findOne;
exports.findOneBy = findOneBy;
exports.delete = deleteRecord;
exports.deleteByBatchId = deleteByBatchId;
exports.update = update;
exports.findAllForInvoiceAccount = findAllForInvoiceAccount;
exports.findByIsFlaggedForRebillingAndRegion = findByIsFlaggedForRebillingAndRegion;
exports.resetIsFlaggedForRebilling = resetIsFlaggedForRebilling;
exports.create = create;
