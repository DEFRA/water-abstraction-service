'use strict';

const batchService = require('../../services/batch-service');
const logger = require('./logger');

const createJobId = (jobName, batch, id) => {
  const baseName = jobName.replace('*', batch.id);
  return id ? `${baseName}.${id}` : baseName;
};

const deleteJobs = async (queue, jobName, job) => {
  const queueName = jobName.replace('*', job.data.batch.id);
  logger.logInfo(job, `Deleting queue ${queueName}`);
  return Promise.all([
    queue.removeJobs(queueName),
    queue.removeJobs(`${queueName}.*`)
  ]);
};

const createFailedHandler = (jobName, errorCode) => async (queue, job, err) => {
  logger.logFailed(job, err);

  // Delete remaining jobs in queue
  if (jobName) {
    await deleteJobs(queue, jobName, job);
  }

  await batchService.setErrorStatus(job.data.batch.id, errorCode);
};

exports.createJobId = createJobId;
exports.createFailedHandler = createFailedHandler;
