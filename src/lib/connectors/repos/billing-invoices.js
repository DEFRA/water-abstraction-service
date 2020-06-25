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
        'billingInvoiceLicences.billingTransactions.chargeElement',
        'billingInvoiceLicences.billingTransactions.chargeElement.purposeUse'
      ]
    });

  return model.toJSON();
};

/**
 * Delete a single record by ID
 * @param {String} id - one or many IDs
 */
const deleteRecord = billingInvoiceId => BillingInvoice
  .forge({ billingInvoiceId })
  .destroy();

exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
exports.findOne = findOne;
exports.upsert = upsert;
exports.delete = deleteRecord;
