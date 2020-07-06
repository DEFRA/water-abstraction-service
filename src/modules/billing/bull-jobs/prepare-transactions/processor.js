'use strict';

const batchService = require('../../services/batch-service');
const transactionService = require('../../services/transactions-service');
const supplementaryBillingService = require('../../services/supplementary-billing-service');
const billingVolumesService = require('../../services/billing-volumes-service');
const repos = require('../../../../lib/connectors/repos');

const logger = require('../lib/logger');

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

module.exports = jobHandler;
