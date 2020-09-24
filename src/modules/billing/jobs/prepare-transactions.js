'use strict';

const { get } = require('lodash');
const { logger } = require('../../../logger');
const repos = require('../../../lib/connectors/repository');

const batchService = require('../services/batch-service');
const supplementaryBillingService = require('../services/supplementary-billing-service');
const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

const JOB_NAME = 'billing.prepare-transactions.*';

const createMessage = (eventId, batch) => {
  return batchJob.createMessage(JOB_NAME, batch, { eventId }, {
    singletonKey: batch.id
  });
};

const handlePrepareTransactions = async job => {
  batchJob.logHandling(job);

  const batchId = get(job, 'data.batch.id');

  try {
    const batch = await batchService.getBatchById(batchId);

    if (batch.isSupplementary()) {
      logger.info(`Processing supplementary transactions ${job.name}`);
      await supplementaryBillingService.processBatch(batch.id);
    }

    // @TODO replace with newRepos.billingBatches.findByBatchId when downstream handlers can cope
    // with camel case
    const transactions = await repos.billingTransactions.getByBatchId(batch.id);

    return {
      batch: job.data.batch,
      transactions
    };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPrepareTransactions);
    throw err;
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handlePrepareTransactions;
