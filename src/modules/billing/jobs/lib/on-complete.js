'use strict';

/**
 * @module contains generic on-complete job handling code before job-specific code is considered
 */

const batchJob = require('./batch-job');
const batchService = require('../../services/batch-service');
const { get } = require('lodash');

/**
 *
 * @param {Object} job - PG boss job
 * @param {Object} messageQueue - PG boss instance
 * @param {Function} handler - the handler that will be called if no errors
 * @param {String} expectedStatus - the expected batch status at this stage in the processing
 * @return {Promise}
 */
const createOnCompleteHandler = async (job, messageQueue, handler, expectedStatus) => {
  batchJob.logOnComplete(job);

  // If job has failed, abort processing of job queue
  if (batchJob.hasJobFailed(job)) {
    return batchJob.deleteHandlerQueue(job, messageQueue);
  }

  // If batch in unexpected status, do nothing
  const batchId = get(job, 'data.request.data.batch.id');
  const batch = await batchService.getBatchById(batchId);

  if (batch.status === expectedStatus) {
    // Custom per-job processing
    return handler(job, messageQueue, batch);
  }
};

exports.createOnCompleteHandler = createOnCompleteHandler;
