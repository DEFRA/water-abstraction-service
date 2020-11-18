'use strict';

const { get } = require('lodash');

const ioRedis = require('../../../lib/connectors/io-redis');
const connection = ioRedis.createConnection();

// Bull queue setup
const { Queue, Worker } = require('bullmq');
const JOB_NAME = 'billing.create-charge';
const queue = new Queue(JOB_NAME, { connection });

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const transactionsService = require('../services/transactions-service');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');
const batchMapper = require('../mappers/batch');
const Transaction = require('../../../lib/models/transaction');
const refreshTotalsJob = require('./refresh-totals');

const createMessage = (batchId, billingBatchTransactionId) => ([
  JOB_NAME,
  {
    batchId,
    billingBatchTransactionId
  },
  {
    jobId: `${JOB_NAME}.${batchId}.${billingBatchTransactionId}`
  }
]);

/**
 * Checks if the error is an HTTP client error (in range 400 - 499)
 * @param {Error} err
 * @return {Boolean}
 */
const isClientError = err => {
  const statusCode = get(err, 'statusCode', 0);
  return (statusCode >= 400) && (statusCode < 500);
};

const updateBatchState = async batch => {
  const statuses = await batchService.getTransactionStatusCounts(batch.id);
  const flags = {
    isReady: get(statuses, Transaction.statuses.candidate, 0) === 0,
    isEmptyBatch: get(statuses, Transaction.statuses.chargeCreated, 0) === 0
  };

  // If still processing transactions, not ready to proceed to next job
  if (!flags.isReady) {
    return flags;
  }

  // Clean up batch
  await batchService.cleanup(batch.id);

  // Set batch status to empty for empty batch
  if (flags.isEmptyBatch) {
    await batchService.setStatus(batch.id, BATCH_STATUS.empty);
  }

  return flags;
};

const handler = async job => {
  batchJob.logHandling(job);

  const transactionId = get(job, 'data.billingBatchTransactionId');
  const batchId = get(job, 'data.batchId');

  try {
    // Create batch model from loaded data
    const batch = await transactionsService.getById(transactionId);

    // Map data to charge module transaction
    const [cmTransaction] = batchMapper.modelToChargeModule(batch);

    // Create transaction in Charge Module
    const response = await chargeModuleBillRunConnector.addTransaction(batch.externalId, cmTransaction);

    // Update/remove our local transaction in water.billing_transactions
    await transactionsService.updateWithChargeModuleResponse(transactionId, response);

    const flags = await updateBatchState(batch);
    return flags;
  } catch (err) {
    // Always log and mark transaction as errored in DB
    transactionsService.setErrorStatus(transactionId);
    batchJob.logHandlingError(job, err);

    // If not a client error, error the batch
    if (!isClientError(err)) {
      await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToCreateCharge);
      throw err;
    }
  }

  return {
    batch: job.data.batch
  };
};

const onComplete = async job => {
  batchJob.logOnComplete(job);

  try {
    const { batchId } = job.data;
    const { isReady, isEmptyBatch } = job.returnvalue;

    if (isReady && !isEmptyBatch) {
      await refreshTotalsJob.queue.add(
        ...refreshTotalsJob.createMessage(batchId)
      );
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

const worker = new Worker(JOB_NAME, handler, { connection, concurrency: 16 });
worker.on('completed', onComplete);
worker.on('error', helpers.onErrorHandler);

exports.createMessage = createMessage;
exports.queue = queue;
