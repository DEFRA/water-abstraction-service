const Bull = require('bull');
const { get } = require('lodash');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');

const JOB_NAME = 'billing.create-bill-run.*';

const queue = new Bull(JOB_NAME);
const populateBatchChargeVersionsJob = require('./populate-batch-charge-versions');

/**
 * Publishes a new 'create bill run' job on the queue
 * @param {Object} batch
 */
const publish = (batch, eventId) => queue.add({
  batch,
  eventId
}, {
  jobId: helpers.createJobId(JOB_NAME, batch)
});

/**
 * Job handler - creates bill run in charge module
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);
  const batchId = get(job, 'data.batch.id');
  const batch = await batchService.createChargeModuleBillRun(batchId);
  return {
    batch
  };
};

const completedHandler = async (job, result) => {
  logger.logCompleted(job);
  populateBatchChargeVersionsJob.publish({
    ...job.data,
    ...result
  });
};

const failedHandler = helpers.createFailedHandler(BATCH_ERROR_CODE.failedToCreateBillRun);

// Set up queue
queue.process(jobHandler);
queue.on('completed', completedHandler);
queue.on('failed', failedHandler);

exports.jobHandler = jobHandler;
exports.failedHandler = failedHandler;
exports.publish = publish;
exports.JOB_NAME = JOB_NAME;
