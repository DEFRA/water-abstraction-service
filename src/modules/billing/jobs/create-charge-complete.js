'use strict';

const refreshTotalsJob = require('./refresh-totals');
const jobService = require('../services/job-service');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');

const isProcessingTransactions = async batchId => {
  const statuses = await batchService.getTransactionStatusCounts(batchId);
  return statuses.candidate > 0;
};

const handleCreateChargeComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToCreateCharge);
  }

  const { eventId } = job.data.request.data;
  const { batch } = job.data.response;
  const { billing_batch_id: batchId } = batch;

  try {
    if (await isProcessingTransactions(batchId)) {
      return;
    }

    // If there are no remaining candidate transactions, publish job to
    // read batch totals in the CM
    await messageQueue.publish(refreshTotalsJob.createMessage(eventId, batch));

    await jobService.setReadyJob(eventId, batchId);
  } catch (err) {
    batchJob.logOnCompleteError(job);
    await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToCreateCharge);
    throw err;
  }
};

module.exports = handleCreateChargeComplete;
