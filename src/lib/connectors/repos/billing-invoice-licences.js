'use strict';

const { bookshelf } = require('../bookshelf');
const billingInvoiceLicence = require('../bookshelf/BillingInvoiceLicence');
const raw = require('./lib/raw');
const queries = require('./queries/billing-invoice-licences');
const makeArray = require('../../../lib/make-array');

const withRelated = [
  'billingInvoice',
  'billingInvoice.billingBatch',
  'billingInvoice.billingBatch.region'
];

/**
 * Gets billingInvoiceLicence and related models by GUID
 * @param {String} id - guid
 * @return {Promise<Object>}
 */
const findOne = async id => {
  const model = await billingInvoiceLicence
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
 * Find One the licence in a batch and aggregate the two part tariff
 * error codes for a licence's underlying transactions.
 * @param {String} batchId
 */
const findOneInvoiceLicenceWithTransactions = async (id) => {
  const model = await billingInvoiceLicence
    .forge({ billingInvoiceLicenceId: id })
    .fetch({
      withRelated: [
        'licence',
        'licence.region',
        'billingTransactions',
        'billingTransactions.chargeElement',
        'billingTransactions.chargeElement.purposeUse'
      ]
    });

  return model.toJSON();
};

/**
 * Delete a single record by ID
 * @param {String} id - one or many IDs
 */
const deleteRecord = billingInvoiceLicenceId => billingInvoiceLicence
  .forge({ billingInvoiceLicenceId })
  .destroy();

exports.findOne = findOne;
exports.deleteByBatchAndInvoiceAccount = deleteByBatchAndInvoiceAccount;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
exports.findLicencesWithTransactionStatusesForBatch = findLicencesWithTransactionStatusesForBatch;
exports.findOneInvoiceLicenceWithTransactions = findOneInvoiceLicenceWithTransactions;
exports.upsert = upsert;
exports.delete = deleteRecord;
