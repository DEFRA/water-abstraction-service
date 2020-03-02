const { find, get } = require('lodash');
const messageQueue = require('../../../../lib/message-queue');
const event = require('../../../../lib/event');
const newEvtRepo = require('../../../../lib/connectors/repos/events.js');
const { logger } = require('../../../../logger');
const returnsUpload = require('../../lib/returns-upload');
const { uploadStatus } = returnsUpload;
const returnsConnector = require('../api-connector');
const errorEvent = require('./error-event');
const bluebird = require('bluebird');

const JOB_NAME = 'persist-bulk-returns';

/**
 * Begins the process of persisting the returns that are declared
 * valid in the metadata of the event with the given event id.
 *
 * @param {String/UUID} eventId The event id that contains the returns to persist
 * @returns {Promise}
 */
const publishPersistBulkReturns = eventId => {
  messageQueue.publish(JOB_NAME, returnsUpload.buildJobData(eventId));
};

const updateEvent = (evt, updatedReturns) => {
  const metadata = Object.assign({}, evt.metadata, {
    returns: updatedReturns
  });
  const changes = {
    metadata,
    status: uploadStatus.SUBMITTED
  };
  return newEvtRepo.update(evt, changes);
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
 * @param {object} job PG Boss Job containing the event id
 */
const handlePersistReturns = async job => {
  const { eventId } = job.data;
  let evt;

  logger.info('persist job started returns', { eventId });

  try {
    evt = await event.load(eventId);
    const returns = await getReturnsFromS3(eventId);

    const validatedReturns = get(evt, 'metadata.returns', []);
    const updatedReturns = await persistReturns(validatedReturns, returns);
    await updateEvent(evt, updatedReturns);
    job.done();
  } catch (err) {
    logger.error('Failed to persist bulk returns upload', err, { job });
    await errorEvent.setEventError(evt, err);
    job.done(err);
  }
};

exports.jobName = JOB_NAME;
exports.publish = publishPersistBulkReturns;
exports.handler = handlePersistReturns;
