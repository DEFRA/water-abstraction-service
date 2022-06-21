'use strict';

const { get, inRange } = require('lodash');

const JOB_NAME = 'billing.create-charge';

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const transactionsService = require('../services/transactions-service');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');
const batchMapper = require('../mappers/batch');
const Transaction = require('../../../lib/models/transaction');
const { jobName: refreshTotalsJobName } = require('./refresh-totals');
const config = require('../../../../config');
const { logger } = require('../../../logger');

const workerOptions = {
  concurrency: config.billing.createChargeJobConcurrency
};

const createMessage = (batchId, billingBatchTransactionId) => ([
  JOB_NAME,
  {
    batchId,
    billingBatchTransactionId
  },
  {
    jobId: `${JOB_NAME}.${batchId}.${billingBatchTransactionId}`,
    attempts: 6,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
]);

const getStatus = err => get(err, 'statusCode', 0);

/**
 * Checks if the error is an HTTP client error (in range 400 - 499)
 * @param {Error} err
 * @return {Boolean}
 */
const isClientError = err => inRange(getStatus(err), 400, 500);

const updateBatchState = async batchId => {
  const statuses = await batchService.getTransactionStatusCounts(batchId);

  const isReady = get(statuses, Transaction.statuses.candidate, 0) === 0;

  if (isReady) {
    // Clean up batch
    await batchService.cleanup(batchId);
  }

  return isReady;
};

const getTransactionStatus = batch => get(batch, 'invoices[0].invoiceLicences[0].transactions[0].status');

const handler = async job => {
  batchJob.logHandling(job);
  const transactionId = get(job, 'data.billingBatchTransactionId');
  const batchId = get(job, 'data.batchId');

  // Create batch model from loaded data
  // the batch contains all lower level related objects for pre-sroc
  // but for sroc we don't map all the related objects that is not needed
  // where it will slow down performance and the batch variable is then mainly transaction data
  const batch = await transactionsService.getById(transactionId);

  try {
    // Skip CM call if transaction is already processed
    const status = getTransactionStatus(batch) || batch.status;
    if (status !== Transaction.statuses.candidate) {
      return await updateBatchState(batchId);
    }

    // Map data to charge module transaction
    const [cmTransaction] = batchMapper.modelToChargeModule(batch);

    // Create transaction in Charge Module
    const cmBatchId = batch.externalId || batch.billingInvoiceLicence.billingInvoice.billingBatch.externalId;
    const response = await chargeModuleBillRunConnector.addTransaction(cmBatchId, cmTransaction);

    // Update/remove our local transaction in water.billing_transactions
    await transactionsService.updateWithChargeModuleResponse(transactionId, response);

    // Note: the await is needed to ensure any error is handled here
    return await updateBatchState(batchId);
  } catch (err) {
    batchJob.logHandlingError(job, err);

    // if error code >= 400 and < 500 set transaction status to error and continue
    if (isClientError(err)) {
      await transactionsService.setErrorStatus(transactionId);
      return updateBatchState(batchId);
    }
    // throw error to retry
    throw err;
  }
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);

  try {
    const { batchId } = job.data;
    const isReady = job.returnvalue;

    if (isReady) {
      await batchService.requestCMBatchGeneration(batchId);
      await queueManager.add(refreshTotalsJobName, batchId);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
  }
};

const onFailedHandler = async (job, err) => {
  const batchId = get(job, 'data.batchId');
  const transactionId = get(job, 'data.billingBatchTransactionId');

  // On final attempt, error the batch and log
  if (helpers.isFinalAttempt(job)) {
    try {
      logger.error(`Transaction with id ${transactionId} not generated in CM after ${job.attemptsMade} attempts, marking batch as errored ${batchId}`);
      await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToCreateCharge);
    } catch (error) {
      logger.error(`Unable to set batch status ${batchId}`, error);
    }
  } else {
    // Do normal error logging
    helpers.onFailedHandler(job, err);
  }
};

exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = onFailedHandler;
exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.workerOptions = workerOptions;
exports.hasScheduler = true;
