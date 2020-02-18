'use strict';

const Boom = require('@hapi/boom');
const batchService = require('./services/batch-service');
const { BATCH_STATUS } = require('../../lib/models/batch');

/**
 * Pre handler for loading a batch. This function returns the
 * batch so it can be assigned to a property on the request.pre object
 * as defined in the route config.
 *
 * @param {Object} request Hapi request object
 */
const loadBatch = async request => {
  const { batchId } = request.params;
  const batch = await batchService.getBatchById(batchId);

  if (!batch) {
    throw Boom.notFound(`No batch found with id: ${batchId}`);
  }

  return batch;
};

/**
 * Pre handler that will ensure that the batch found at
 * request.pre.batch has a status of review.
 *
 * @param {Object} request Hapi request object
 * @param {Object} h Hapi response toolkit
 */
const ensureBatchInReviewState = async (request, h) => {
  const { batch } = request.pre;

  if (!batch) {
    throw new Error('The batch needs to be assigned to the batch property of pre');
  }

  if (batch.status !== BATCH_STATUS.review) {
    throw Boom.forbidden(`Batch must be in review state. Current status is ${batch.status}`);
  }

  return h.continue;
};

exports.loadBatch = loadBatch;
exports.ensureBatchInReviewState = ensureBatchInReviewState;
