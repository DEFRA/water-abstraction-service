'use strict';

const path = require('path');

const logger = require('../lib/logger');
const helpers = require('../lib/helpers');

const { BATCH_ERROR_CODE } = require('../../../../lib/models/batch');
const batchService = require('../../services/batch-service');

const createChargeJob = require('../create-charge');

const JOB_NAME = 'billing.prepare-transactions.*';

/**
 * Publishes a new 'prepare transactions' job on the queue
 * @param {Object} batch
 */
const createMessage = data => ({
  data,
  options: {
    jobId: helpers.createJobId(JOB_NAME, data.batch)
  }
});

const completedHandler = async (job, result) => {
  logger.logCompleted(job);

  const { batch, transactions } = result;

  if (transactions.length === 0) {
    logger.logInfo(job, 'empty batch');
    await batchService.setStatusToEmptyWhenNoTransactions(batch);
    return;
  }

  logger.logInfo(job, `${transactions.length} transactions produced, creating charges...`);

  for (const transaction of transactions) {
    await createChargeJob.publish({
      ...job.data,
      batch,
      transaction
    });
  }
};

const failedHandler = helpers.createFailedHandler(JOB_NAME, BATCH_ERROR_CODE.failedToPrepareTransactions);

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.processor = (path.join(__dirname, './processor.js'));
exports.onComplete = completedHandler;
exports.onFailed = failedHandler;
