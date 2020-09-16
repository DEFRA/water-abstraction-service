'use strict';

const createChargeJob = require('./create-charge');
const jobService = require('../services/job-service');
const batchJob = require('./lib/batch-job');

const { BATCH_STATUS } = require('../../../lib/models/batch');

const { logger } = require('../../../logger');

const { partialRight } = require('lodash');
const { createOnCompleteHandler } = require('./lib/on-complete');

const handlePrepareTransactionsComplete = async (job, messageQueue, batch) => {
  try {
    const { eventId } = job.data.request.data;
    const { transactions } = job.data.response;
    const batchId = batch.id;

    if (transactions.length === 0) {
      // no transactions created for this batch, update the
      // batch status to empty
      logger.info(`No transactions produced for batch ${batchId}, finalising batch run`);
      await jobService.setEmptyBatch(eventId, batchId);
      return;
    }

    logger.info(`${transactions.length} transactions produced for batch ${batchId}, creating charges...`);

    // Note: publish jobs in series to avoid overwhelming message queue
    for (const transaction of transactions) {
      const message = createChargeJob.createMessage(eventId, batch, transaction);
      await messageQueue.publish(message);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

module.exports = partialRight(createOnCompleteHandler, handlePrepareTransactionsComplete, BATCH_STATUS.processing);
