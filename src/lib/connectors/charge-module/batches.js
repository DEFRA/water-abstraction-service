'use strict';

const request = require('./request');

const getBatchPayload = (regionCode, batchId, customerReference) => ({
  region: regionCode,
  filter: {
    batchNumber: batchId,
    customerReference
  }
});

const deleteBatch = async (regionCode, batchId) => {
  const payload = getBatchPayload(regionCode, batchId);
  return request.post('v1/wrls/transaction_queue/remove', payload);
};

const approve = async (regionCode, batchId) => {
  const payload = getBatchPayload(regionCode, batchId);
  return request.patch('v1/wrls/transaction_queue/approve', payload);
};

const send = async (regionCode, batchId, isDraft = true, invoiceAccountId) => {
  const payload = getBatchPayload(regionCode, batchId, invoiceAccountId);
  payload.draft = isDraft;
  return request.post('v1/wrls/billruns', payload);
};

exports.delete = deleteBatch;
exports.approve = approve;
exports.send = send;
