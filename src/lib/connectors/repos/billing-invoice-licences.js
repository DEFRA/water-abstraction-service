const { bookshelf } = require('../bookshelf');
const raw = require('./lib/raw');
const queries = require('./queries/billing-invoice-licences');

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

exports.upsert = upsert;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
