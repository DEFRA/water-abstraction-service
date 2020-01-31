const { BillingTransaction, bookshelf } = require('../bookshelf');
const queries = require('./queries/billing-transactions');
const camelCaseKeys = require('../../camel-case-keys');

/**
 * Gets transaction and related models by GUID
 * @param {String} id - guid
 * @return {Object}
 */
const findOne = async id => {
  const model = await BillingTransaction
    .forge({ billing_transaction_id: id })
    .fetch({
      withRelated: [
        'chargeElement',
        'billingInvoiceLicence',
        'billingInvoiceLicence.licence',
        'billingInvoiceLicence.licence.region',
        'billingInvoiceLicence.billingInvoice',
        'billingInvoiceLicence.billingInvoice.billingBatch',
        'billingInvoiceLicence.billingInvoice.billingBatch.region'
      ]
    });

  return model.toJSON();
};

/**
 * For supplementary billing, finds transactions in the supplied batch ID
 * for hash comparison
 * @param {String} batchId - the supplementary batch ID being processed
 * @return {Promise<Array>}
 */
const findByBatchId = async batchId => {
  const result = await bookshelf.knex.raw(queries.findByBatchId, { batchId });
  return camelCaseKeys(result.rows);
};

/**
 * For supplementary billing, finds historical transactions
 * in completed batches for licences which are also contained
 * in the supplied batch ID, for hash comparison
 * @param {String} batchId - the supplementary batch ID being processed
 * @return {Promise<Array>} water.billing_transactions rows
 */
const findHistoryByBatchId = async batchId => {
  const result = await bookshelf.knex.raw(queries.findHistoryByBatchId, { batchId });
  return camelCaseKeys(result.rows);
};

exports.findOne = findOne;
exports.findHistoryByBatchId = findHistoryByBatchId;
exports.findByBatchId = findByBatchId;
