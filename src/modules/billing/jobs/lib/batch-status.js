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
    throw new Error(`Expected ${statuses} batch status, but got ${batch.status}`);
  }
};

const assertCmBatchIsGeneratedOrBilled = cmBatch => {
  if (!['generated', 'billed', 'billing_not_required'].includes(cmBatch.status)) {
    throw new Error(`Expected 'generated', 'billing_not_required' or 'billed' batch status, but instead got ${cmBatch.status}`);
  }
};

const assertBatchIsProcessing = partialRight(assertBatchIsStatus, [Batch.BATCH_STATUS.processing, Batch.BATCH_STATUS.sending]);
const assertBatchIsInReview = partialRight(assertBatchIsStatus, [Batch.BATCH_STATUS.review]);

exports.assertCmBatchIsGeneratedOrBilled = assertCmBatchIsGeneratedOrBilled;
exports.assertBatchIsProcessing = assertBatchIsProcessing;
exports.assertBatchIsInReview = assertBatchIsInReview;
