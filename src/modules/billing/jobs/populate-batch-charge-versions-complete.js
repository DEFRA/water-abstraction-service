'use strict';

const Batch = require('../../../lib/models/batch');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const jobService = require('../services/job-service');
const batchJob = require('./lib/batch-job');

const twoPartTariffMatchingJob = require('./two-part-tariff-matching');
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
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToPopulateChargeVersions);
  }

  const { eventId } = job.data.request.data;
  const { batch, billingBatchChargeVersionYears } = job.data.response;

  // Mark batch as empty if there are no charge version years to process
  if (billingBatchChargeVersionYears.length === 0) {
    return jobService.setEmptyBatch(eventId, batch.id);
  }

  // For annual, go straight to processing charge versions
  // for other bill runs, go to TPT matching
  const message = batch.type === Batch.BATCH_TYPE.annual
    ? processChargeVersionsJob.createMessage(eventId, batch)
    : twoPartTariffMatchingJob.createMessage(eventId, batch);

  return messageQueue.publish(message);
};

module.exports = handlePopulateBatchChargeVersionsComplete;
