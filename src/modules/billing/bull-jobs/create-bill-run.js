const { redis } = require('../../../../config');
const path = require('path');
const Bull = require('bull');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

const JOB_NAME = 'billing.create-bill-run.*';

const queue = new Bull(JOB_NAME, { redis });
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

const completedHandler = async (job, result) => {
  logger.logCompleted(job);
  populateBatchChargeVersionsJob.publish({
    ...job.data,
    ...result
  });
};

const failedHandler = helpers.createFailedHandler(BATCH_ERROR_CODE.failedToCreateBillRun, queue, JOB_NAME);

// Set up queue
queue.process(path.join(__dirname, '/processors/create-bill-run.js'));
queue.on('completed', completedHandler);
queue.on('failed', failedHandler);

exports.failedHandler = failedHandler;
exports.publish = publish;
exports.JOB_NAME = JOB_NAME;
