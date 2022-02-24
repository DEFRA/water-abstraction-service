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
  'billingInvoiceLicence.billingInvoice.billingBatch'
  // 'billingInvoiceLicence.billingInvoice.billingBatch.region'
];

/**
 * Gets transaction and related models by GUID
 * @param {String} id - guid
 * @return {Promise<Object>}
 */
const findOne = async id => {
  const model = await BillingTransaction
    .forge({ billingTransactionId: id })
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

const findStatusCountsByBatchId = batchId => raw.multiRow(queries.findStatusCountsByBatchId, { batchId });

/**
 * Updates a water.billing_transactions record for the given id
 *
 * @param {String} transactionId UUID of the transaction to update
 * @param {Object} changes Key values pairs of the changes to make
 * @param {Boolean} [isUpdateRequired] Whether to throw an error if no rows updated
 */
const update = (billingTransactionId, changes, isUpdateRequired = true) => BillingTransaction
  .where('billing_transaction_id', 'in', makeArray(billingTransactionId))
  .save(changes, { patch: true, require: isUpdateRequired });

/**
 * Deletes all transactions by invoice licence ID
 * @param {String} invoiceLicenceId
 * @return {Promise}
 */
const deleteByInvoiceLicenceId = invoiceLicenceId => bookshelf
  .knex('water.billing_transactions')
  .where('billing_invoice_licence_id', invoiceLicenceId)
  .delete();

/**
* Deletes all transactions for given batch
* @param {String} batchId - guid
*/
const deleteByBatchId = async batchId => bookshelf.knex.raw(queries.deleteByBatchId, { batchId });

/**
 * Deletes all transactions by invoice ID
 * @param {String} billingInvoiceId
 * @return {Promise}
 */
const deleteByInvoiceId = billingInvoiceId => bookshelf
  .knex
  .raw(queries.deleteByInvoiceId, { billingInvoiceId });

/**
 * Get number of transactions in batch
 * @param {String} billingBatchId
 * @return {Promise<Number>}
 */
const countByBatchId = async billingBatchId => {
  const { count } = await raw.singleRow(queries.countByBatchId, { billingBatchId });
  return parseInt(count);
};

/**
 * Updates the isCredited flag for the region for all transactions
 * that was credited back
 * @param {String} regionId
 * @return {Promise}
 */
const updateIsCredited = regionId => bookshelf
  .knex
  .raw(queries.updateIsCredited, { regionId });

exports.findOne = findOne;
exports.find = find;
exports.findHistoryByBatchId = findHistoryByBatchId;
exports.findByBatchId = findByBatchId;
exports.delete = deleteRecords;
exports.create = create;
exports.findStatusCountsByBatchId = findStatusCountsByBatchId;
exports.update = update;
exports.deleteByInvoiceLicenceId = deleteByInvoiceLicenceId;
exports.deleteByBatchId = deleteByBatchId;
exports.deleteByInvoiceId = deleteByInvoiceId;
exports.countByBatchId = countByBatchId;
exports.updateIsCredited = updateIsCredited;
