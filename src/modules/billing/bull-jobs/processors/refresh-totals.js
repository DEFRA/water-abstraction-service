const batchService = require('../../services/batch-service');
const logger = require('../lib/logger');

/**
 * Job handler - creates bill run in charge module
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);

  const { batch } = job.data;

  // Update batch with totals/bill run ID from charge module
  await batchService.refreshTotals(batch);
};

module.exports = jobHandler;
