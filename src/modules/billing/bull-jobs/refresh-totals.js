const Bull = require('bull');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

const batchService = require('../services/batch-service');

const JOB_NAME = 'billing.refresh-totals.*';
const uuid = require('uuid/v4');

const queue = new Bull(JOB_NAME);

/**
 * Publishes a new 'populate batch charge versions' job on the queue
 * @param {Object} data
 */
const publish = data => queue.add(data, {
  jobId: helpers.createJobId(JOB_NAME, data.batch, uuid())
});

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

const failedHandler = async (job, err) => {
  logger.logFailed(job, err);
};

// Set up queue
queue.process(jobHandler);
queue.on('failed', failedHandler);

exports.jobHandler = jobHandler;
exports.failedHandler = failedHandler;
exports.publish = publish;
exports.JOB_NAME = JOB_NAME;
