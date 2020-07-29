'use strict';

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const processChargeVersionsJob = require('./process-charge-versions');

/**
 * Handles the response from populating the billing batch with charge versions and decides
 * whether or not to publish a new job to continue with the batch flow.
 *
 * If batch charge versions were created, then create the batch charge version year
 * entries and publish
 *
 * @param {Object} job PG Boss job (including response from populateBatchChargeVersions handler)
 */
const handlePopulateBatchChargeVersionsComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToProcessTwoPartTariff);
  }

  // If no review needed, proceed to process the charge version years
  if (!job.data.response.isReviewNeeded) {
    const { eventId, batch } = job.data.request.data;
    const message = processChargeVersionsJob.createMessage(eventId, batch);
    await messageQueue.publish(message);
  }
};

module.exports = handlePopulateBatchChargeVersionsComplete;
