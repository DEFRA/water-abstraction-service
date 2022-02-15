'use strict';

const { partialRight } = require('lodash');

const Batch = require('../../../../lib/models/batch');

/**
 * Throws an error if the batch is not the provided status
 * @param {Batch} batch
 * @param {String} status
 */
const assertBatchIsStatus = (batch, statuses) => {
  if (!batch.statusIsOneOf(...statuses)) {
    throw new Error(`Expected ${statuses} batch status`);
  }
};

const assertBatchIsProcessing = (batch) => {
  if (!([Batch.BATCH_STATUS.processing, Batch.BATCH_STATUS.sending].includes(batch.status))) {
    throw new Error('Expected processing or sending batch status');
  }
  return true;
};

const assertBatchIsInReview = partialRight(assertBatchIsStatus, [Batch.BATCH_STATUS.review]);

exports.assertBatchIsProcessing = assertBatchIsProcessing;
exports.assertBatchIsInReview = assertBatchIsInReview;
