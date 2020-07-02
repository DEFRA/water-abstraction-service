const Bull = require('bull');
const { get } = require('lodash');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../lib/models/batch');
const Transaction = require('../../../lib/models/transaction');

const batchService = require('../services/batch-service');
const transactionsService = require('../services/transactions-service');
const mappers = require('../mappers');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

const refreshTotalsJob = require('./refresh-totals');

const JOB_NAME = 'billing.create-charge.*';

const queue = new Bull(JOB_NAME);

/**
 * Publishes a new 'prepare transactions' job on the queue
 * @param {Object} batch
 */
const publish = data => queue.add(data, {
  jobId: helpers.createJobId(JOB_NAME, data.batch, data.transaction.billingTransactionId)
});

/**
 * Job handler - creates bill run in charge module
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);

  const transactionId = get(job, 'data.transaction.billingTransactionId');

  // Create batch model from loaded data
  const batch = await transactionsService.getById(transactionId);

  // Map data to charge module transaction
  const [cmTransaction] = mappers.batch.modelToChargeModule(batch);

  // Create transaction in Charge Module
  const response = await chargeModuleBillRunConnector.addTransaction(batch.externalId, cmTransaction);

  // Update/remove our local transaction in water.billing_transactions
  await transactionsService.updateWithChargeModuleResponse(transactionId, response);
};

const completedHandler = async (job, result) => {
  logger.logCompleted(job);

  const { batch } = job.data;

  const statuses = await batchService.getTransactionStatusCounts(batch.id);

  // Still processing transactions
  if (get(statuses, Transaction.statuses.candidate, 0) > 0) {
    return;
  }

  // Removes invoices/licences with no transactions
  await batchService.cleanup(batch.id);

  // Empty batch - note: once the charge module allows zero transactions
  // again, this step can be removed, as we should never have an
  // empty batch at this stage
  if (get(statuses, Transaction.statuses.chargeCreated, 0) === 0) {
    return batchService.setStatusToEmptyWhenNoTransactions(batch);
  }

  // Mark batch as ready
  await batchService.setStatus(batch.id, BATCH_STATUS.ready);

  // Refresh totals
  await refreshTotalsJob.publish({ batch });
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
