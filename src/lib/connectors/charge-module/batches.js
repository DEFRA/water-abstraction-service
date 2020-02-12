'use strict';

const request = require('./request');

const getBatchPayload = (regionCode, batchId) => ({
  region: regionCode,
  filter: {
    batchNumber: batchId
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

const send = async (regionCode, batchId, isDraft = true) => {
  const payload = getBatchPayload(regionCode, batchId);
  payload.draft = isDraft;
  return request.post('v1/wrls/billruns', payload);
};

exports.delete = deleteBatch;
exports.approve = approve;
exports.send = send;
