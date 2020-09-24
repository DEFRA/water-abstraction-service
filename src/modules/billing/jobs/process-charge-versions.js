'use strict';

const { get } = require('lodash');

const chargeVersionYearService = require('../services/charge-version-year');
const batchJob = require('./lib/batch-job');
const batchService = require('../services/batch-service');
const JOB_NAME = 'billing.process-charge-versions.*';
const batchStatus = require('./lib/batch-status');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

/**
 * Creates the request object for publishing a new job for processing
 * all charge version years
 *
 * @param {String} eventId The uuid of the event
 * @param {Object} batch The batch object
 */
const createMessage = (eventId, batch) => {
  return batchJob.createMessage(JOB_NAME, batch, { eventId }, {
    singletonKey: batch.id
  });
};

const handleProcessChargeVersions = async job => {
  batchJob.logHandling(job);

  const batchId = get(job, 'data.batch.id');

  try {
    // Load batch
    const batch = await batchService.getBatchById(batchId);

    // Check batch in "processing" status
    batchStatus.assertBatchIsProcessing(batch);

    // Get all charge version years for processing
    const billingBatchChargeVersionYears = await chargeVersionYearService.getForBatch(batch.id);

    return {
      batch,
      billingBatchChargeVersionYears
    };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToProcessChargeVersions);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handleProcessChargeVersions;
exports.jobName = JOB_NAME;
