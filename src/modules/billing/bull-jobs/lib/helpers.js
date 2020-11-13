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

const onErrorHandler = (job, err) => {
  logger.error(`Job ${job.name} ${job.id} errored`, err);
};

exports.createMessage = createMessage;
exports.onErrorHandler = onErrorHandler;
