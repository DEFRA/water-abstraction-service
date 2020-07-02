const path = require('path');
const Bull = require('bull');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

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

const failedHandler = async (job, err) => {
  logger.logFailed(job, err);
};

// Set up queue
queue.process(path.join(__dirname, '/processors/refresh-totals.js'));
queue.on('failed', failedHandler);

exports.failedHandler = failedHandler;
exports.publish = publish;
exports.JOB_NAME = JOB_NAME;
