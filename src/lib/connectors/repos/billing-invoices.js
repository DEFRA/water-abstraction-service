const { bookshelf, BillingInvoice } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/billing-invoices');
const helpers = require('./lib/helpers');

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

exports.upsert = upsert;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
exports.findOne = findOne;
exports.delete = deleteRecord;
exports.deleteByBatchId = deleteByBatchId;
exports.update = update;
