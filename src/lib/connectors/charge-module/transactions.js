'use strict';

const request = require('./request');

/**
 * Retrieves transactions from the charge module transactions API
 * for a given batch. Will not paginate results.
 *
 * @param {String} batchId UUID for the batch id to retrieve
 * @param {String} customerReference Optional value to find only transactions for an invoice
 */
const getTransactionQueue = (batchId, customerReference) => {
  const query = {
    perPage: 1000000,
    page: 1,
    batchNumber: batchId,
    ...(customerReference && { customerReference })
  };

  return request.get('v1/wrls/transaction_queue', query);
};

exports.getTransactionQueue = getTransactionQueue;
