'use strict';

const { get } = require('lodash');

const { logger } = require('../../../../logger');
const batchService = require('../../services/batch-service');

const getRequestName = job => job.data.request.name;

const logHandling = job => {
  logger.info(`Handling: ${job.id}`);
};

const logOnComplete = job => {
  logger.info(`onComplete: ${job.id}`);
};

const logOnCompleteError = (job, error) => {
  logger.error(`Error handling onComplete: ${getRequestName(job)}`, error, get(job, 'data.request.data'));
};

const logHandlingError = (job, error) => {
  logger.error(`Error: ${job.name}`, error, job.data);
};

/**
 * In the event that a job fails when processing a batch,
 * this function tidies up so that no further processing
 * happens in the job queue.
 *
 * @param {Object<PgBoss.Job>} job The job that has failed
 * @param {Object<PgBoss>} messageQueue The PgBoss message queue
 */
const deleteHandlerQueue = (job, messageQueue) => {
  const name = getRequestName(job);
  logger.info(`Deleting queue ${name}`);
  return messageQueue.deleteQueue(name);
};

/**
 * Creates a message to be added to the PG Boss job queue.
 *
 * @param {String} nameTemplate The queue name including a asterisk that will be replace with the batch id
 * @param {Object<Batch>} batch The batch being processed
 * @param {?Object} data Optional additional data
 * @param {Object?} options Optional options
 */
const createMessage = (nameTemplate, batch, data, options) => {
  return {
    name: nameTemplate.replace('*', batch.id),
    data: {
      batch,
      ...(data && data)
    },
    ...(options && { options })
  };
};

/**
 * Determines if the job has failed
 *
 * @param {Object<PgBoss.Job} job The job passed to the onComplete handler
 */
const hasJobFailed = job => job.data.failed === true;

/**
 * Deletes all onComplete jobs in queue for the supplied job
 * @param {Object} job
 * @param {Object<PgBoss>} messageQueue The PgBoss message queue
 */
const deleteOnCompleteQueue = (job, messageQueue) => {
  const name = `__state__completed__${getRequestName(job)}`;
  logger.info(`Deleting queue ${name}`);
  return messageQueue.deleteQueue(name);
};

/**
 * When an error has occurred in the PG boss handler,
 * we need to:
 * - Log the message
 * - Mark the batch is in error status
 * @param {Object} job - PG boss message
 * @param {Error} err - the error thrown in the handler
 * @param {Number} errorCode - batch error code
 * @return {Error} returns the modified error
 */
const logHandlingErrorAndSetBatchStatus = async (job, err, errorCode) => {
  // Decorate error with error code and log
  err.errorCode = errorCode;
  logHandlingError(job, err);

  // Mark batch as in error status
  const batchId = get(job, 'data.batch.id');
  await batchService.setErrorStatus(batchId, errorCode);
  return err;
};

exports.createMessage = createMessage;
exports.deleteHandlerQueue = deleteHandlerQueue;
exports.hasJobFailed = hasJobFailed;
exports.logHandling = logHandling;
exports.logHandlingError = logHandlingError;
exports.logOnComplete = logOnComplete;
exports.logOnCompleteError = logOnCompleteError;
exports.deleteOnCompleteQueue = deleteOnCompleteQueue;
exports.logHandlingErrorAndSetBatchStatus = logHandlingErrorAndSetBatchStatus;
