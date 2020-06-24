'use strict';

const { bookshelf, BillingInvoiceLicence } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/billing-invoice-licences');

const withRelated = [
  'billingInvoice',
  'billingInvoice.billingBatch',
  'billingInvoice.billingBatch.region'
];

/**
 * Gets BillingInvoiceLicence and related models by GUID
 * @param {String} id - guid
 * @return {Promise<Object>}
 */
const findOne = async id => {
  const model = await BillingInvoiceLicence
    .forge({ BillingInvoiceLicenceId: id })
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
  const model = await BillingInvoiceLicence
    .forge({ BillingInvoiceLicenceId: id })
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
const deleteRecord = BillingInvoiceLicenceId => BillingInvoiceLicence
  .forge({ BillingInvoiceLicenceId })
  .destroy();

/**
 * Delete multiple by invoice ID
 * @param {String} id - one or many IDs
 */
const deleteByInvoiceId = billingInvoiceId => BillingInvoiceLicence
  .forge()
  .where({ billing_invoice_id: billingInvoiceId })
  .destroy();

exports.findOne = findOne;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
exports.findLicencesWithTransactionStatusesForBatch = findLicencesWithTransactionStatusesForBatch;
exports.findOneInvoiceLicenceWithTransactions = findOneInvoiceLicenceWithTransactions;
exports.upsert = upsert;
exports.delete = deleteRecord;
exports.deleteByInvoiceId = deleteByInvoiceId;
