const prepareTransactionsJob = require('./prepare-transactions');
const { logger } = require('../../../logger');
const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');

const chargeVersionYearService = require('../services/charge-version-year');

const handleProcessChargeVersionComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToProcessChargeVersions);
  }

  const { eventId } = job.data.request.data;
  const { chargeVersionYear, batch } = job.data.response;
  const batchId = chargeVersionYear.billing_batch_id;

  const { processing } = await chargeVersionYearService.getStatusCounts(batchId);

  if (processing === 0) {
    logger.info(`No more charge version year entries to process for batch: ${batchId}`);

    await batchJob.deleteOnCompleteQueue(job, messageQueue);

    if (batch.batch_type === 'two_part_tariff') {
      return batchService.setStatus(batchId, BATCH_STATUS.review);
    }

    const message = prepareTransactionsJob.createMessage(eventId, batch);
    return messageQueue.publish(message);
  }

  logger.info(`${processing} items yet to be processed for batch ${batchId}`);
};

module.exports = handleProcessChargeVersionComplete;
