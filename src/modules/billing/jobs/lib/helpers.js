'use strict';

const { logger } = require('../../../../logger');

const createMessage = (jobName, batchId) => {
  return [
    jobName,
    { batchId },
    {
      jobId: `${jobName}.${batchId}`
    }
  ];
};

const onFailedHandler = (job, err) => {
  logger.error(`Job ${job.name} ${job.id} failed`, err);
};

const isFinalAttempt = job => job.attemptsMade >= job.opts.attempts;

exports.createMessage = createMessage;
exports.onFailedHandler = onFailedHandler;
exports.isFinalAttempt = isFinalAttempt;
