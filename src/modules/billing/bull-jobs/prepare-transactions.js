const Bull = require('bull');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');
const billingVolumesService = require('../services/billing-volumes-service');
const transactionService = require('../services/transactions-service');
const supplementaryBillingService = require('../services/supplementary-billing-service');
const repos = require('../../../lib/connectors/repos');

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

/**
 * Job handler - creates bill run in charge module
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);

  const batch = await batchService.getBatchById(job.data.batch.id);
  const billingVolumesForBatch = await billingVolumesService.getVolumesForBatch(batch);

  if (billingVolumesForBatch.length > 0) {
    await transactionService.updateTransactionVolumes(batch);
  }

  if (batch.isSupplementary()) {
    logger.logInfo(job, 'Processing supplementary transactions');
    await supplementaryBillingService.processBatch(batch.id);
  }

  const transactions = await repos.billingTransactions.findByBatchId(batch.id);

  return {
    batch,
    transactions
  };
};

const completedHandler = async (job, result) => {
  logger.logCompleted(job);

  const { batch, transactions } = result;

  if (transactions.length === 0) {
    logger.logInfo(job, 'empty batch');
    return batchService.setStatusToEmptyWhenNoTransactions(batch);
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

const failedHandler = helpers.createFailedHandler(BATCH_ERROR_CODE.failedToPrepareTransactions);

// Set up queue
queue.process(jobHandler);
queue.on('completed', completedHandler);
queue.on('failed', failedHandler);

exports.jobHandler = jobHandler;
exports.failedHandler = failedHandler;
exports.publish = publish;
exports.JOB_NAME = JOB_NAME;
