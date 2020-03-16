'use strict';

const { get } = require('lodash');

const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');

const JOB_NAME = 'billing.refreshTotals.*';

/**
 * Calls the CM to refresh the totals in water.billing_batches table
 *
 * @param {String} eventId The UUID of the event
 * @param {Object} batch The object from the batch database table
 */
const createMessage = batchId => ({
  name: JOB_NAME.replace('*', batchId),
  data: {
    batchId
  },
  options: {
    singletonKey: batchId,
    retryLimit: 5,
    retryDelay: 120,
    retryBackoff: true
  }
});

const handleRefreshTotals = async job => {
  batchJob.logHandling(job);

  const batchId = get(job, 'data.batchId');

  try {
    const batch = await batchService.getBatchById(batchId);

    // Update batch with totals/bill run ID from charge module
    await batchService.refreshTotals(batch);
  } catch (err) {
    batchJob.logHandlingError(job, err);
    throw err;
  }

  return {
    batch: job.data.batch
  };
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handleRefreshTotals;
