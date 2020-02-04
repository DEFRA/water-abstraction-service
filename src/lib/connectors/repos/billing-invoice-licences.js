const { bookshelf } = require('../bookshelf');

const camelCaseKeys = require('../../camel-case-keys');

const queries = require('./queries/billing-invoice-licences');

/**
 * Upserts a water.billing_invoice_licences record
 * @param {Object} data - camel case
 */
const upsert = async data => {
  const result = await bookshelf.knex.raw(queries.upsert, data);
  return camelCaseKeys(result.rows[0]);
};

/**
 * Deletes invoice licences in the batch which have no transactions
 * @param {String} batchId
 */
const deleteEmptyByBatchId = batchId =>
  bookshelf.knex.raw(queries.deleteEmptyByBatchId, { batchId });

exports.upsert = upsert;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
