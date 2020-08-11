'use strict';

const chargeVersionYearService = require('../services/charge-version-year');
const batchJob = require('./lib/batch-job');
const batchService = require('../services/batch-service');
const JOB_NAME = 'billing.process-charge-versions.*';
const batchStatus = require('./lib/batch-status');

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

  try {
    // Load batch
    const batch = await batchService.getBatchById(job.data.batch.id);

    // Check batch in "processing" status
    batchStatus.assertBatchIsProcessing(batch);

    // Get all charge version years for processing
    const billingBatchChargeVersionYears = await chargeVersionYearService.getForBatch(batch.id);

    return {
      batch,
      billingBatchChargeVersionYears
    };
  } catch (err) {
    batchJob.logHandlingError(job, err);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handleProcessChargeVersions;
exports.jobName = JOB_NAME;
