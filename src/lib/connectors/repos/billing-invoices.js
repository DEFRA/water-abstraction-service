const { bookshelf } = require('../bookshelf');

const camelCaseKeys = require('../../camel-case-keys');

const queries = require('./queries/billing-invoices');

/**
 * Upserts a water.billing_invoices record
 * @param {Object} data - camel case
 */
const upsert = async data => {
  const result = await bookshelf.knex.raw(queries.upsert, data);
  return camelCaseKeys(result.rows[0]);
};

/**
 * Deletes invoices in the batch which have no invoice licences
 * @param {String} batchId
 */
const deleteEmptyByBatchId = batchId =>
  bookshelf.knex.raw(queries.deleteEmptyByBatchId, { batchId });

exports.upsert = upsert;
exports.deleteEmptyByBatchId = deleteEmptyByBatchId;
