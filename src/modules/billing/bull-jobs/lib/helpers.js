'use strict';

const Bull = require('bull');

const config = require('../../../../../config');
const batchService = require('../../services/batch-service');
const logger = require('./logger');

/**
 * Creates a Bull queue with the name specified
 * @param {String} queueName
 * @return {Queue} Bull queue instance
 */
const createQueue = queueName => new Bull(queueName, { redis: config.redis });

/**
 * Creates a job ID for the job specified
 * @param {String} jobName
 * @param {Object} batch
 * @param {String} [id] - optional ID
 */
const createJobId = (jobName, batch, id) => {
  const baseName = jobName.replace('*', batch.id);
  return id ? `${baseName}.${id}` : baseName;
};

/**
 * Deletes all jobs in queue
 * @param {Queue} queue
 * @param {String} jobName
 * @param {Object} job
 */
const deleteJobs = async (queue, jobName, job) => {
  const queueName = jobName.replace('*', job.data.batch.id);
  logger.logInfo(job, `Deleting queue ${queueName}`);
  return queue.removeJobs(`${queueName}*`);
};

const createFailedHandler = (jobName, errorCode) => async (queue, job, err) => {
  logger.logFailed(job, err);

  // Delete remaining jobs in queue
  if (jobName) {
    await deleteJobs(queue, jobName, job);
  }

  await batchService.setErrorStatus(job.data.batch.id, errorCode);
};

/**
 * Default 'create message' implementation, includes the batch
 * @param {Object} batch
 */
const createMessage = (jobName, data) => ({
  data,
  options: {
    jobId: createJobId(jobName, data.batch)
  }
});

exports.createQueue = createQueue;
exports.createJobId = createJobId;
exports.createFailedHandler = createFailedHandler;
exports.createMessage = createMessage;
