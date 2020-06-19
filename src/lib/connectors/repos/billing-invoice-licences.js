'use strict';

const { bookshelf } = require('../bookshelf');
const BillingInvoiceLicence = require('../bookshelf/BillingInvoiceLicence');
const raw = require('./lib/raw');
const queries = require('./queries/billing-invoice-licences');

const withRelated = [
  'billingInvoice',
  'billingInvoice.billingBatch',
  'billingInvoice.billingBatch.region'
];

/**
 * Filters billingVolumes for chargeElements to only get
 * unapproved billing volumes
 * @param {Object} invoiceLicence
 */
const findUnapprovedBillingVolumes = invoiceLicence => {
  for (const transaction of invoiceLicence.billingTransactions) {
    transaction.chargeElement.billingVolume = transaction.chargeElement.billingVolume.find(billingVolume => !billingVolume.isApproved);
  }
  return invoiceLicence;
};

/**
 * Gets billingInvoiceLicence and related models by GUID
 * @param {String} id - guid
 * @return {Promise<Object>}
 */
const findOne = async id => {
  const model = await BillingInvoiceLicence
    .forge({ billingInvoiceLicenceId: id })
    .fetch({
      withRelated
    });
  return model ? model.toJSON() : null;
};

/**
 * Upserts a water.billing_invoice_licences record
 * @param {Object} data - camel case
 */
const upsert = async data => raw.singleRow(queries.upsert, data);

/**
 * Deletes invoice licences in the batch which have no transactions
 * @param {String} batchId
 */
const deleteEmptyByBatchId = batchId =>
  bookshelf.knex.raw(queries.deleteEmptyByBatchId, { batchId });

/**
 * Deletes invoice licences for the invoice account and batch
 * @param {String} batchId
 * @param {String} invoiceAccountId
 */
const deleteByBatchAndInvoiceAccount = (batchId, invoiceAccountId) =>
  bookshelf.knex.raw(
    queries.deleteByBatchAndInvoiceAccount,
    { batchId, invoiceAccountId }
  );

/**
 * Finds all the licences in a batch and aggregates the two part tariff
 * error codes for a licence's underlying transactions.
 * @param {String} batchId
 */
const findLicencesWithTransactionStatusesForBatch = batchId =>
  raw.multiRow(queries.findLicencesWithTransactionStatusesForBatch, { batchId });

/**
 * Find One licence in a batch with related transactions
 * @param {String} id
 */
const findOneInvoiceLicenceWithTransactions = async id => {
  const results = await BillingInvoiceLicence
    .forge({ billingInvoiceLicenceId: id })
    .fetch({
      withRelated: [
        'licence',
        'licence.region',
        'billingTransactions',
        'billingTransactions.chargeElement',
        'billingTransactions.chargeElement.purposeUse',
        'billingTransactions.chargeElement.billingVolume'
      ]
    }).then(model => {
      const billingInvoiceLicence = model.toJSON();
      return findUnapprovedBillingVolumes(billingInvoiceLicence);
    });

  return results;
};

/**
 * Delete a single record by ID
 * @param {String} id - one or many IDs
 */
const deleteRecord = billingInvoiceLicenceId => BillingInvoiceLicence
  .forge({ billingInvoiceLicenceId })
  .destroy();

/**
* Deletes all billing invoice licences for given batch
* @param {String} batchId - guid
*/
const deleteByBatchId = async batchId => bookshelf.knex.raw(queries.deleteByBatchId, { batchId });

exports.findOne = findOne;
exports.deleteByBatchAndInvoiceAccount = deleteByBatchAndInvoiceAccount;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
exports.findLicencesWithTransactionStatusesForBatch = findLicencesWithTransactionStatusesForBatch;
exports.findOneInvoiceLicenceWithTransactions = findOneInvoiceLicenceWithTransactions;
exports.upsert = upsert;
exports.delete = deleteRecord;
exports.deleteByBatchId = deleteByBatchId;
