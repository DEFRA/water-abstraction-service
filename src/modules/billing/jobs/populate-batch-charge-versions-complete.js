'use strict';

const Batch = require('../../../lib/models/batch');
const processChargeVersions = require('./process-charge-version');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const jobService = require('../services/job-service');
const batchJob = require('./lib/batch-job');

const twoPartTariffMatchingJob = require('./two-part-tariff-matching');

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

  // For annual batch, proceed to process charge versions
  if (batch.type === Batch.BATCH_TYPE.annual) {
    return processChargeVersions(job, messageQueue);
  }

  // For TPT/supplementary, publish TPT matching job
  const message = twoPartTariffMatchingJob.createMessage(eventId, batch);
  return messageQueue.publish(message);
};

module.exports = handlePopulateBatchChargeVersionsComplete;
