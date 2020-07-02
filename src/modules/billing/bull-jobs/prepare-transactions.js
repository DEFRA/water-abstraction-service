const path = require('path');
const Bull = require('bull');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');

const createChargeJob = require('./create-charge');

const JOB_NAME = 'billing.prepare-transactions.*';

const queue = new Bull(JOB_NAME);

/**
 * Publishes a new 'prepare transactions' job on the queue
 * @param {Object} batch
 */
const publish = data => queue.add(data, {
  jobId: helpers.createJobId(JOB_NAME, data.batch)
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

const failedHandler = helpers.createFailedHandler(BATCH_ERROR_CODE.failedToPrepareTransactions, queue, JOB_NAME);

// Set up queue
queue.process(path.join(__dirname, '/processors/prepare-transactions.js'));
queue.on('completed', completedHandler);
queue.on('failed', failedHandler);

exports.failedHandler = failedHandler;
exports.publish = publish;
exports.JOB_NAME = JOB_NAME;
