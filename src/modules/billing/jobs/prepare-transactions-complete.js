'use strict';

const createChargeJob = require('./create-charge');
const jobService = require('../services/job-service');
const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

const { logger } = require('../../../logger');

const handlePrepareTransactionsComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToPrepareTransactions);
  }

  const { eventId } = job.data.request.data;
  const { batch, transactions } = job.data.response;
  const batchId = batch.billing_batch_id;

  if (transactions.length === 0) {
    // no transactions created for this batch, update the
    // batch status to complete
    logger.info(`No transactions produced for batch ${batchId}, finalising batch run`);
    return jobService.setEmptyBatch(eventId, batchId);
  }

  logger.info(`${transactions.length} transactions produced for batch ${batchId}, creating charges...`);

  return Promise.all(transactions.map(transaction => {
    const message = createChargeJob.createMessage(eventId, batch, transaction);
    return messageQueue.publish(message);
  }));
};

module.exports = handlePrepareTransactionsComplete;
