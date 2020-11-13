'use strict';

const { get, partial } = require('lodash');

const { ioredis: connection } = require('../../../lib/connectors/io-redis');

// Bull queue setup
const { Queue, Worker } = require('bullmq');
const JOB_NAME = 'billing.prepare-transactions';
const queue = new Queue(JOB_NAME, { connection });

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const createChargeJob = require('./create-charge');
const { logger } = require('../../../logger');
const supplementaryBillingService = require('../services/supplementary-billing-service');

// @todo replace deprecated repository method
const repos = require('../../../lib/connectors/repository');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const handler = async job => {
  batchJob.logHandling(job);

  const batchId = get(job, 'data.batchId');

  try {
    const batch = await batchService.getBatchById(batchId);

    // Supplementary processing handles credits/charges
    if (batch.isSupplementary()) {
      logger.info(`Processing supplementary transactions ${job.name}`);
      await supplementaryBillingService.processBatch(batch.id);
    }

    // Get all transactions now in batch
    const transactions = await repos.billingTransactions.getByBatchId(batch.id);

    // Set empty batch
    if (transactions.length === 0) {
      logger.info(`No transactions produced for batch ${batchId}, finalising batch run`);
      const updatedBatch = await batchService.setStatus(batchId, BATCH_STATUS.empty);
      return { batch: updatedBatch, transactions };
    }

    return {
      batch,
      transactions
    };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPrepareTransactions);
    throw err;
  }
};

const onComplete = async job => {
  try {
    const { transactions, batch } = job.returnvalue;
    const batchId = batch.id;

    logger.info(`${transactions.length} transactions produced for batch ${batchId}, creating charges...`);

    // Note: publish jobs in series to avoid overwhelming message queue
    for (const transaction of transactions) {
      await createChargeJob.queue.add(
        ...createChargeJob.createMessage(batchId, transaction.billing_transaction_id)
      );
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

const worker = new Worker(JOB_NAME, handler, { connection });
worker.on('completed', onComplete);
worker.on('error', helpers.onErrorHandler);

exports.createMessage = createMessage;
exports.queue = queue;
