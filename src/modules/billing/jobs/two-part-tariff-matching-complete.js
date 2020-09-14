'use strict';

const { partialRight } = require('lodash');

const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const processChargeVersionsJob = require('./process-charge-versions');
const { createOnCompleteHandler } = require('./lib/on-complete');

/**
 * Handles the response from the two part tariff matching and
 * proceeds to process the charge versions if no TPT review is
 * needed
 *
 * @param {Object} job PG Boss job (including response from twoPartTariffMatching handler)
 */
const handleTwoPartTariffMatchingComplete = async (job, messageQueue, batch) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToProcessTwoPartTariff);
  }

  try {
  // If no review needed, proceed to process the charge version years
    if (!job.data.response.isReviewNeeded) {
      const { eventId } = job.data.request.data;
      const message = processChargeVersionsJob.createMessage(eventId, batch);
      await messageQueue.publish(message);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

module.exports = partialRight(createOnCompleteHandler, handleTwoPartTariffMatchingComplete, BATCH_STATUS.processing);
