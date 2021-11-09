const { find, get, set } = require('lodash');
const eventsService = require('../../../../lib/services/events');
const { logger } = require('../../../../logger');
const returnsUpload = require('../../lib/returns-upload');
const { uploadStatus } = returnsUpload;
const returnsConnector = require('../api-connector');
const errorEvent = require('./error-event');
const bluebird = require('bluebird');

const JOB_NAME = 'persist-bulk-returns';

/**
 * Creates a message for Bull MQ
 * @param {Object} data containing eventId and companyId
 * @returns {Object}
 */
const createMessage = data => {
  logger.info(`Create Message ${JOB_NAME}`);
  return [
    JOB_NAME,
    returnsUpload.buildJobData(data),
    {
      jobId: `${JOB_NAME}.${data.eventId}`
    }
  ];
};
const updateEvent = (event, updatedReturns) => {
  set(event, 'metadata.returns', updatedReturns);
  event.status = uploadStatus.SUBMITTED;
  return eventsService.update(event);
};

/**
 * Formats a success/error object to store in the event metadata for each
 * validated return
 * @param  {Object}  validatedReturn - validated return object from metadata
 * @param  {Object} [error=false]    - error if applicable
 * @return {Object} success/error object
 */
const formatResult = (validatedReturn, error = false) => {
  return {
    ...validatedReturn,
    submitted: !error,
    error: error || null
  };
};

/**
 * Persists a single validated return, and resolves with a success/error object
 * to store in the event metadata
 * @param  {Object}  validatedReturn - validated return object from metadata
 * @param  {Object}  returnToSave    - return object from uploaded JSON
 * @return {Promise}                 resolves with error/success object
 */
const persistReturn = async (validatedReturn, returnToSave) => {
  try {
    await returnsConnector.persistReturnData(returnToSave);
    return formatResult(validatedReturn);
  } catch (err) {
    return formatResult(validatedReturn, err);
  }
};

/**
 * Creates a mapper function which persists a return
 * @param  {Array} allReturns - all returns in the uploaded JSON
 * @return {Function}           mapper
 */
const createMapper = allReturns => validatedReturn => {
  const { returnId } = validatedReturn;
  const returnToSave = find(allReturns, { returnId });
  return persistReturn(validatedReturn, returnToSave);
};

/**
 * Attempts to persist each of the validated returns.
 *
 * Mutates the validatedReturns array adding the result of
 * the attempted upload.
 */
const persistReturns = (validatedReturns, allReturns) => {
  const mapper = createMapper(allReturns);
  return bluebird.map(validatedReturns, mapper, { concurrency: 1 });
};

/**
 * Gets the returns JSON from AWS S3
 *
 * @param {string} eventId The id of the event representing this bulk upload
 * @returns {object} The returns that are requested for upload
 */
const getReturnsFromS3 = async eventId => {
  const s3Object = await returnsUpload.getReturnsS3Object(eventId, 'json');
  return returnsUpload.s3ObjectToJson(s3Object);
};

/**
 * Gets a list of all submitted returns from S3, and a list of validated
 * returns from the event. Then for each of the validated ones, persists
 * the full details from S3.
 *
 * With each persist attempt, the result is written back to the event
 * metadata.
 *
 * @param {object} job Bull MQ Job containing the event id
 */
const handlePersistReturns = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`);
  const { eventId } = job.data;
  let event;

  logger.info('persist job started returns', { eventId });

  try {
    event = await eventsService.findOne(eventId);
    if (!event) return errorEvent.throwEventNotFoundError(eventId);

    const returns = await getReturnsFromS3(eventId);

    const validatedReturns = get(event, 'metadata.returns', []);
    const updatedReturns = await persistReturns(validatedReturns, returns);
    await updateEvent(event, updatedReturns);
  } catch (err) {
    logger.error('Failed to persist bulk returns upload', err, { job });
    await errorEvent.setEventError(event, err);
    throw err;
  }
};

const onFailed = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.createMessage = createMessage;
exports.handler = handlePersistReturns;
exports.onFailed = onFailed;
exports.onComplete = onComplete;
exports.jobName = JOB_NAME;
