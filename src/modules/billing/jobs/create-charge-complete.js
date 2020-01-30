'use strict';

const createChargeJob = require('./create-charge');
const jobService = require('../services/job-service');

const { logger } = require('../../../logger');

const handleCreateChargeComplete = async job => {
  logger.info(`onComplete - ${createChargeJob.jobName}`);

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
  const { eventId } = job.data.request.data;
  const { batch } = job.data.response;
  await jobService.setCompletedJob(eventId, batch.billing_batch_id);
};

module.exports = handleCreateChargeComplete;
