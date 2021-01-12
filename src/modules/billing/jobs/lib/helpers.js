'use strict';

const { isObject } = require('lodash');
const { logger } = require('../../../../logger');

const createMessage = (jobName, batch) => {
  const id = isObject(batch) ? batch.id : batch;
  return [
    jobName,
    { batchId: id },
    {
      jobId: `${jobName}.${id}`
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
