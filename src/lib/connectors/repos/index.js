/**
 * This directory contains repositories for DB access that are written in a
 * a newer style:
 * - Bookshelf.js is used rather than the Repository class from hapi-pg-rest-api
 * - Data is camel-cased automatically
 *
 * Finding a single record:
 * - findOne(id) - find a single record by ID
 * - findOneBySomeParam() - find a single record by some other query
 *
 * Finding multiple records:
 * - find() - find all records
 * - findBySomeParam() - find all records by some other query
 * - findPage() - find a page of results
 * - findPageBySomeParam()
 *
 * Other operations:
 * - create(data)
 * - update(id, data)
 * - delete(id)
 */

exports.billingBatches = require('./BillingBatchRepository');
exports.billingTransactions = require('./BillingTransactionRepository');
