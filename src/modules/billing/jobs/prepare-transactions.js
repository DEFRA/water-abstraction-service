const { logger } = require('../../../logger');
const repos = require('../../../lib/connectors/repository');

const JOB_NAME = 'billing.prepare-transactions';

const createMessage = (eventId, batch) => ({
  name: JOB_NAME,
  data: { eventId, batch }
});

const handlePrepareTransactions = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  const { batch } = job.data;

  const transactions = await repos.billingTransactions.getByBatchId(batch.billing_batch_id);

  /**
   * Placeholder:
   *
   * get the batch from the job data
   *
   * loadCandidateTransactions
   *
   * if (isSupplementaryBatch?) {
   *  loadExistingTransactions
   *  diff transactions deleting any candidate transactions that are not required
   * }
   *
   * persist new transactions to water.billing.transactions
   *
   * return all the transactions that have been created
   * return the batch
   */
  return {
    batch,
    transactions
  };
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handlePrepareTransactions;
