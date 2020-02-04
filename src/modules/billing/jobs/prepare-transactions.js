const { logger } = require('../../../logger');
const repos = require('../../../lib/connectors/repository');

const batchService = require('../services/batch-service');
const supplementaryBillingService = require('../services/supplementary-billing-service');

const JOB_NAME = 'billing.prepare-transactions';

const createMessage = (eventId, batch) => ({
  name: JOB_NAME,
  data: { eventId, batch }
});

const handlePrepareTransactions = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  try {
    const batch = await batchService.getBatchById(job.data.batch.billing_batch_id);

    if (batch.isSupplementary()) {
      logger.info(`Processing supplementary transactions ${JOB_NAME}`);
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
    logger.error(`Error handling ${JOB_NAME}`, err, {
      batch: job.data.batch
    });
    await batchService.setErrorStatus(job.data.batch.billing_batch_id);
    throw err;
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handlePrepareTransactions;
