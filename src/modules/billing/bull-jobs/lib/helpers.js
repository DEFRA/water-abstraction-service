'use strict';

const Bull = require('bull');
const config = require('../../../../../config');
const batchService = require('../../services/batch-service');
const logger = require('./logger');

/**
 * Creates a Bull message queue with the supplied name and the
 * Redis config from the project config file
 * @param {String} name
 * @return {Queue}
 */
const createQueue = name => new Bull(name, { redis: config.redis });

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

const createFailedHandler = (errorCode, queue, jobName) => async (job, err) => {
  logger.logFailed(job, err);

  // Delete remaining jobs in queue
  if (jobName) {
    await deleteJobs(queue, jobName, job);
  }

  await batchService.setErrorStatus(job.data.batch.id, errorCode);
};

exports.createJobId = createJobId;
exports.createFailedHandler = createFailedHandler;
exports.createQueue = createQueue;
