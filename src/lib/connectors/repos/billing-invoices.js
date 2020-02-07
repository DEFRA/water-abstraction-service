const { bookshelf } = require('../bookshelf');
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

exports.upsert = upsert;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
