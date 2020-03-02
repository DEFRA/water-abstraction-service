const repo = require('../../../lib/connectors/repository');

const prepareTransactionsJob = require('./prepare-transactions');
const { logger } = require('../../../logger');
const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

const handleProcessChargeVersionComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToProcessChargeVersions);
  }

  const { eventId } = job.data.request.data;
  const { chargeVersionYear, batch } = job.data.response;
  const batchId = chargeVersionYear.billing_batch_id;

  const { rowCount } = await repo.billingBatchChargeVersionYears.findProcessingByBatch(batchId);

  if (rowCount === 0) {
    logger.info(`No more charge version year entries to process for batch: ${batchId}`);
    const message = prepareTransactionsJob.createMessage(eventId, batch);
    return messageQueue.publish(message);
  }

  logger.info(`${rowCount} items yet to be processed for batch ${batchId}`);
};

module.exports = handleProcessChargeVersionComplete;
