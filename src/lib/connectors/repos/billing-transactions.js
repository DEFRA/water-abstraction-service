const { BillingTransaction, bookshelf } = require('../bookshelf');
const queries = require('./queries/billing-transactions');
const makeArray = require('../../../lib/make-array');
const raw = require('./lib/raw');

const withRelated = [
  'chargeElement',
  'billingInvoiceLicence',
  'billingInvoiceLicence.licence',
  'billingInvoiceLicence.licence.region',
  'billingInvoiceLicence.billingInvoice',
  'billingInvoiceLicence.billingInvoice.billingBatch',
  'billingInvoiceLicence.billingInvoice.billingBatch.region'
];

/**
 * Gets transaction and related models by GUID
 * @param {String} id - guid
 * @return {Object}
 */
const findOne = async id => {
  const model = await BillingTransaction
    .forge({ billing_transaction_id: id })
    .fetch({
      withRelated
    });

  return model.toJSON();
};

/**
 * Finds many transactions with relates data
 * @param {Array<String>} ids
 * @return {Promise<Array>}
 */
const find = async ids => {
  const result = await BillingTransaction
    .collection()
    .where('billing_transaction_id', 'in', ids)
    .fetch({
      withRelated
    });
  return result.toJSON();
};

/**
 * For supplementary billing, finds transactions in the supplied batch ID
 * for hash comparison
 * @param {String} batchId - the supplementary batch ID being processed
 * @return {Promise<Array>}
 */
const findByBatchId = batchId => raw.multiRow(queries.findByBatchId, { batchId });

/**
 * For supplementary billing, finds historical transactions
 * in completed batches for licences which are also contained
 * in the supplied batch ID, for hash comparison
 * @param {String} batchId - the supplementary batch ID being processed
 * @return {Promise<Array>} water.billing_transactions rows
 */
const findHistoryByBatchId = batchId => raw.multiRow(queries.findHistoryByBatchId, { batchId });

/**
 * Delete one or many records
 * @param {String|Array<String>} id - one or many IDs
 */
const deleteRecords = id => bookshelf
  .knex('water.billing_transactions')
  .whereIn('billing_transaction_id', makeArray(id))
  .delete();

/**
 * Insert a new transaction record
 * @param {Object} data - camel case
 */
const create = async data => {
  const model = await BillingTransaction
    .forge(data)
    .save();
  return model.toJSON();
};

exports.findOne = findOne;
exports.find = find;
exports.findHistoryByBatchId = findHistoryByBatchId;
exports.findByBatchId = findByBatchId;
exports.delete = deleteRecords;
exports.create = create;
