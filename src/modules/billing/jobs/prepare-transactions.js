'use strict';

const { get, partial } = require('lodash');

const JOB_NAME = 'billing.prepare-transactions';

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const { jobName: createChargeJobName } = require('./create-charge');
const { logger } = require('../../../logger');
const supplementaryBillingService = require('../services/supplementary-billing-service');
const billingTransactionsRepo = require('../../../lib/connectors/repos/billing-transactions');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const getTransactionId = transaction => transaction.billingTransactionId;

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
    const transactions = await billingTransactionsRepo.findByBatchId(batch.id);
    const billingTransactionIds = transactions.map(getTransactionId);

    return {
      billingTransactionIds
    };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPrepareTransactions);
    throw err;
  }
};

const onComplete = async (job, queueManager) => {
  try {
    const batchId = get(job, 'data.batchId');
    const { billingTransactionIds } = job.returnvalue;

    // @todo with rebilling there can be 0 transactions here - if so we need to skip to next step

    logger.info(`${billingTransactionIds.length} transactions produced for batch ${batchId}, creating charges...`);

    // Note: publish jobs in series to avoid overwhelming message queue
    for (const billingTransactionId of billingTransactionIds) {
      await queueManager.add(createChargeJobName, batchId, billingTransactionId);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
