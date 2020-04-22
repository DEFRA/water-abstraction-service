const prepareTransactionsJob = require('./prepare-transactions');
const { logger } = require('../../../logger');
const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');
const jobService = require('../services/job-service');

const chargeVersionYearService = require('../services/charge-version-year');

const handleProcessChargeVersionComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToProcessChargeVersions);
  }

  const { eventId } = job.data.request.data;
  const { chargeVersionYear, batch: batchFromJobData } = job.data.response;
  const batchId = chargeVersionYear.billing_batch_id;

  const { processing } = await chargeVersionYearService.getStatusCounts(batchId);

  if (processing === 0) {
    logger.info(`No more charge version year entries to process for batch: ${batchId}`);

    const batch = await batchService.getBatchById(batchId);
    await batchJob.deleteOnCompleteQueue(job, messageQueue);

    if (batch.isTwoPartTariff()) {
      return jobService.setReviewJob(eventId, batchId);
    }

    const message = prepareTransactionsJob.createMessage(eventId, batchFromJobData);
    return messageQueue.publish(message);
  }

  logger.info(`${processing} items yet to be processed for batch ${batchId}`);
};

module.exports = handleProcessChargeVersionComplete;
