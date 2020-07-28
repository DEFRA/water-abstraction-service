'use strict';

const { processChargeVersionYears } = require('./lib/process-charge-version-years');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');

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
    return processChargeVersionYears(job, messageQueue);
  }
};

module.exports = handlePopulateBatchChargeVersionsComplete;
