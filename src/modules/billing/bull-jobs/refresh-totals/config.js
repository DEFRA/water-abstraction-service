'use strict';

const path = require('path');

const logger = require('../lib/logger');
const helpers = require('../lib/helpers');

const JOB_NAME = 'billing.refresh-totals.*';
const uuid = require('uuid/v4');

/**
 * Publishes a new 'populate batch charge versions' job on the queue
 * @param {Object} data
 */
const createMessage = data => ({
  data,
  options: {
    jobId: helpers.createJobId(JOB_NAME, data.batch, uuid())
  }
});

const failedHandler = async (job, err) => {
  logger.logFailed(job, err);
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.processor = (path.join(__dirname, './processor.js'));
exports.onFailed = failedHandler;
