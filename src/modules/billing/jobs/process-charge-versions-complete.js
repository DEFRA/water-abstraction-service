'use strict';

const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const processChargeVersionJob = require('./process-charge-version');

const handleProcessChargeVersionsComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToProcessChargeVersions);
  }

  try {
    const { eventId, batch } = job.data.request.data;
    const { billingBatchChargeVersionYears } = job.data.response;

    // Publish a job to process each charge version year
    for (const billingBatchChargeVersionYear of billingBatchChargeVersionYears) {
      const message = processChargeVersionJob.createMessage(eventId, billingBatchChargeVersionYear, batch);
      await messageQueue.publish(message);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

module.exports = handleProcessChargeVersionsComplete;
