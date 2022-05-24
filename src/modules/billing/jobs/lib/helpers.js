'use strict';

const { logger } = require('../../../../logger');

const createMessage = (jobName, batchId) => {
  console.log(jobName);
  return [
    jobName,
    { batchId },
    {
      jobId: `${jobName}.${batchId}`
    }
  ];
};

const onFailedHandler = (job, err) => {
  console.log(`${job} - faile`);
  logger.error(`Job ${job.name} ${job.id} failed`, err);
};

const isFinalAttempt = job => job.attemptsMade >= job.opts.attempts;

exports.createMessage = createMessage;
exports.onFailedHandler = onFailedHandler;
exports.isFinalAttempt = isFinalAttempt;
