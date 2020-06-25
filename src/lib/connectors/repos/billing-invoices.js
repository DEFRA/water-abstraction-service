const { bookshelf, BillingInvoice } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/billing-invoices');

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
      withRelated: [
        'billingBatch',
        'billingBatch.region',
        'billingInvoiceLicences',
        'billingInvoiceLicences.licence',
        'billingInvoiceLicences.licence.region',
        'billingInvoiceLicences.billingTransactions',
        'billingInvoiceLicences.billingTransactions.billingVolume',
        'billingInvoiceLicences.billingTransactions.chargeElement',
        'billingInvoiceLicences.billingTransactions.chargeElement.purposeUse'
      ]
    });

  return model.toJSON();
};

const deleteByBatchAndInvoiceAccountId = (batchId, invoiceAccountId) => {
  return BillingInvoice
    .forge()
    .where({
      invoice_account_id: invoiceAccountId,
      billing_batch_id: batchId
    }).destroy();
};

/**
* Deletes all billing invoice licences for given batch
* @param {String} batchId - guid
*/
const deleteByBatchId = async batchId => BillingInvoice
  .forge()
  .where({ billing_batch_id: batchId })
  .destroy();

exports.deleteByBatchAndInvoiceAccountId = deleteByBatchAndInvoiceAccountId;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
exports.findOne = findOne;
exports.upsert = upsert;
exports.deleteByBatchId = deleteByBatchId;
