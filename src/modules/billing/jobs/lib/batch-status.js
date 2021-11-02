'use strict';

const { partialRight } = require('lodash');

const Batch = require('../../../../lib/models/batch');

/**
 * Throws an error if the batch is not the provided status
 * @param {Batch} batch
 * @param {String} status
 */
const assertBatchIsStatus = (batch, status) => {
  if (!batch.statusIsOneOf(status)) {
    throw new Error(`Expected ${status} batch status`);
  }
};

const assertBatchIsProcessing = partialRight(assertBatchIsStatus, Batch.BATCH_STATUS.processing);
const assertBatchIsInReview = partialRight(assertBatchIsStatus, Batch.BATCH_STATUS.review);

exports.assertBatchIsProcessing = assertBatchIsProcessing;
exports.assertBatchIsInReview = assertBatchIsInReview;
