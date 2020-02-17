'use strict';

const createChargeJob = require('./create-charge');
const refreshTotalsJob = require('./refresh-totals');
const jobService = require('../services/job-service');

const batchService = require('../services/batch-service');

const { logger } = require('../../../logger');

const isProcessingTransactions = async batchId => {
  const statuses = await batchService.getTransactionStatusCounts(batchId);
  return statuses.candidate > 0;
};

const handleCreateChargeComplete = async (job, messageQueue) => {
  const { eventId } = job.data.request.data;
  const { batch } = job.data.response;
  const { billing_batch_id: batchId } = batch;

  logger.info(`onComplete - ${createChargeJob.jobName}`);

  try {
    if (await isProcessingTransactions()) {
      return;
    }

    // If there are no remaining candidate transactions, publish job to
    // read batch totals in the CM
    await messageQueue.publish(refreshTotalsJob.createMessage(eventId, batch));

    /**
     * Placeholder
     *
     * Find billing_transactions for the batch that are
     * not completed
     *
     * If there are transactions left to process do nothing
     *
     * If there are no more transactions to process then
     * the batch is complete. Update the batch status and the
     * event status
     */

    await jobService.setReadyJob(eventId, batchId);
  } catch (err) {
    logger.error(`Error handling onComplete - ${createChargeJob.jobName}`, err, {
      batchId
    });
    await batchService.setErrorStatus(batchId);
    throw err;
  }
};

module.exports = handleCreateChargeComplete;
