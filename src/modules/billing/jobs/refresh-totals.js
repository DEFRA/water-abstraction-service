const { get } = require('lodash');
const { logger } = require('../../../logger');
const batchService = require('../services/batch-service');

const JOB_NAME = 'billing.refreshTotals';

/**
 * Calls the CM to refresh the totals in water.billing_batches table
 *
 * @param {String} eventId The UUID of the event
 * @param {Object} batch The object from the batch database table
 */
const createMessage = (eventId, batch) => ({
  name: JOB_NAME,
  data: { eventId, batch },
  options: {
    singletonKey: batch.billing_batch_id
  }
});

const handleRefreshTotals = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  const batchId = get(job, 'data.batch.billing_batch_id');

  try {
    const batch = await batchService.getBatchById(batchId);

    // Update batch with totals/bill run ID from charge module
    await batchService.refreshTotals(batch);
  } catch (err) {
    // Log error
    logger.error(`${JOB_NAME} error`, err, {
      batchId
    });
    throw err;
  }

  return {
    batch: job.data.batch
  };
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handleRefreshTotals;
