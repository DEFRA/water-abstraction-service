const prepareTransactionsJob = require('./prepare-transactions');
const createChargeJob = require('./create-charge');
const jobService = require('../services/jobService');

const { logger } = require('../../../logger');

const handlePrepareTransactionsComplete = async (job, messageQueue) => {
  logger.info(`onComplete - ${prepareTransactionsJob.jobName}`);

  const { eventId } = job.data.request.data;
  const { batch, transactions } = job.data.response;
  const batchId = batch.billing_batch_id;

  if (transactions.length === 0) {
    // no transactions created for this batch, update the
    // batch status to complete
    logger.info(`No transactions produced for batch ${batchId}, finalising batch run`);
    return jobService.setCompletedJob(eventId, batchId);
  }

  logger.info(`${transactions.length} transactions produced for batch ${batchId}, creating charges...`);

  return Promise.all(transactions.map(transaction => {
    const message = createChargeJob.createMessage(eventId, batch, transaction);
    return messageQueue.publish(message);
  }));
};

module.exports = handlePrepareTransactionsComplete;
