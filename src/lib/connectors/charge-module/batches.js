'use strict';

const request = require('./request');

const getBatchPayload = (regionCode, batchId, customerReference) => ({
  region: regionCode,
  filter: {
    batchNumber: batchId,
    ...customerReference && { customerReference }
  }
});

const remove = (regionCode, batchId, customerReference) => {
  const payload = getBatchPayload(regionCode, batchId, customerReference);
  return request.post('v1/wrls/transaction_queue/remove', payload);
};

/**
 * Removes all transactions from the queue for the given region
 * code and batch id
 *
 * Effectively removing the batch
 *
 * @param {String} regionCode The region code
 * @param {String} batchId The id of the batch to remove
 */
const deleteBatch = (regionCode, batchId) =>
  remove(regionCode, batchId);

/**
 * Removes all transactions from the queue for the given region
 * code, customer reference and batch id
 *
 * Effectively remove the account from the batch
 *
 * @param {String} regionCode The region code
 * @param {String} batchId The id of the batch to remove
 * @param {String} customerReference The customer reference
 */
const deleteAccountFromBatch = (regionCode, batchId, customerReference) =>
  remove(regionCode, batchId, customerReference);

const approve = async (regionCode, batchId) => {
  const payload = getBatchPayload(regionCode, batchId);
  return request.patch('v1/wrls/transaction_queue/approve', payload);
};

const send = async (regionCode, batchId, isDraft = true, customerReference) => {
  const payload = getBatchPayload(regionCode, batchId, customerReference);
  payload.draft = isDraft;
  return request.post('v1/wrls/billruns', payload);
};

exports.approve = approve;
exports.delete = deleteBatch;
exports.deleteAccountFromBatch = deleteAccountFromBatch;
exports.send = send;
