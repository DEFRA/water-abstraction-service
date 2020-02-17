'use strict';

const createChargeJob = require('./create-charge');
const jobService = require('../services/job-service');

const batchService = require('../services/batch-service');

const { logger } = require('../../../logger');

const handleCreateChargeComplete = async job => {
  const { eventId } = job.data.request.data;
  const { billing_batch_id: batchId } = job.data.response.batch;

  logger.info(`onComplete - ${createChargeJob.jobName}`);

  try {
    const batch = await batchService.getBatchById(batchId);

    // Update batch with totals/bill run ID from charge module
    await batchService.refreshTotals(batch);

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

    await jobService.setReadyJob(eventId, batch.id);
  } catch (err) {
    logger.error(`Error handling ${createChargeJob.jobName}`, err, {
      batchId
    });
    await batchService.setErrorStatus(batchId);
    throw err;
  }
};

module.exports = handleCreateChargeComplete;
