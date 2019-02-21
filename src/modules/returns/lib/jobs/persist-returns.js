const messageQueue = require('../../../../lib/message-queue');
const event = require('../../../../lib/event');
const { logger } = require('@envage/water-abstraction-helpers');
const returnsUpload = require('../../lib/returns-upload');
const { uploadStatus } = returnsUpload;
const returnsConnector = require('../api-connector');

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

const updateEventMetadata = (evt, updatedReturns) => {
  if (updatedReturns) {
    evt.metadata = Object.assign(evt.metadata, {
      returns: updatedReturns
    });
  }
};

const updateEvent = (evt, status, updatedReturns) => {
  updateEventMetadata(evt, updatedReturns);
  evt.status = status;
  event.save(evt);
};

const updateValidatedReturnWithResult = (validatedReturn, error = false) => {
  validatedReturn.submitted = !error;
  validatedReturn.error = error || null;
};

/**
 * Attempts to persist each of the validated returns.
 *
 * Mutates the validatedReturns array adding the result of
 * the attempted upload.
 */
const persistReturns = async (validatedReturns, allReturns) => {
  for (const validatedReturn of validatedReturns) {
    try {
      const returnToSave = allReturns.find(ret => ret.returnId === validatedReturn.returnId);
      await returnsConnector.persistReturnData(returnToSave);
      updateValidatedReturnWithResult(validatedReturn);
    } catch (err) {
      updateValidatedReturnWithResult(validatedReturn, err);
    }
  }

  return validatedReturns;
};

/**
 * Gets the returns JSON from AWS S3
 *
 * @param {string} eventId The id of the event representing this bulk upload
 * @returns {object} The returns that are requested for upload
 */
const getReturnsFromS3 = async eventId => {
  const s3Object = await returnsUpload.getReturnsS3Object(eventId, 'json');
  const { returns } = returnsUpload.s3ObjectToJson(s3Object);
  return returns;
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

  try {
    evt = await event.load(eventId);
    const returns = await getReturnsFromS3(eventId);

    const validatedReturns = evt.metadata.returns;
    const updatedReturns = await persistReturns(validatedReturns, returns);
    await updateEvent(evt, uploadStatus.SUBMITTED, updatedReturns);
    job.done();
  } catch (err) {
    logger.error('Failed to persist bulk returns upload', err, { job });
    await updateEvent(evt, uploadStatus.ERROR);
    job.done(err);
  }
};

exports.jobName = JOB_NAME;
exports.publish = publishPersistBulkReturns;
exports.handler = handlePersistReturns;
