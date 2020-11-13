'use strict';

const { get } = require('lodash');

const { ioredis: connection } = require('../../../lib/connectors/io-redis');

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

/**
 * Gets the next batch status based on the current transaction status counts
 * @param {String} batchId
 * @return {String} status string
 */
const getNextBatchStatus = async batchId => {
  const statuses = await batchService.getTransactionStatusCounts(batchId);
  if (get(statuses, Transaction.statuses.candidate, 0) > 0) {
    return BATCH_STATUS.processing;
  }
  if (get(statuses, Transaction.statuses.chargeCreated, 0) === 0) {
    return BATCH_STATUS.empty;
  }
  return BATCH_STATUS.ready;
};

const updateBatchState = async batch => {
  const nextStatus = await getNextBatchStatus(batch.id);
  if (nextStatus !== BATCH_STATUS.processing) {
    await batchService.cleanup(batch.id);
    await batchService.setStatus(batch.id, nextStatus);
  }
  return batch.fromHash({
    status: nextStatus
  });
};

const handler = async job => {
  batchJob.logHandling(job);

  const transactionId = get(job, 'data.billingBatchTransactionId');
  const batchId = get(job, 'data.batch.id');

  try {
    // Create batch model from loaded data
    const batch = await transactionsService.getById(transactionId);

    // Map data to charge module transaction
    const [cmTransaction] = batchMapper.modelToChargeModule(batch);

    // Create transaction in Charge Module
    const response = await chargeModuleBillRunConnector.addTransaction(batch.externalId, cmTransaction);

    // Update/remove our local transaction in water.billing_transactions
    await transactionsService.updateWithChargeModuleResponse(transactionId, response);

    const updatedBatch = await updateBatchState(batch);

    return { batch: updatedBatch };
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
    const { batch } = job.returnvalue;
    if (batch.status === BATCH_STATUS.ready) {
      await refreshTotalsJob.queue.add(
        ...refreshTotalsJob.createMessage(batch.id)
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
