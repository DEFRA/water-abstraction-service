const messageQueue = require('../../../../lib/message-queue');
const JOB_NAME = 'returns-upload';
const event = require('../../../../lib/event');
const { logger } = require('../../../../logger');
const returnsUpload = require('../../lib/returns-upload');
const errorEvent = require('./error-event');
const uploadAdapters = require('../upload-adapters');

/**
 * Begins the bulk returns process by adding a new task to PG Boss.
 *
 * @param {string} eventId The UUID of the event
 * @returns {Promise}
 */
const publishReturnsUploadStart = eventId =>
  messageQueue.publish(JOB_NAME, returnsUpload.buildJobData(eventId));

/**
 * Validates the object from the S3 bucket using an appropriate adatper
 * If validation errors are found, an error is thrown with a key which
 * allows the error type to be stored in the event metadata
 * @param  {Object}  evt   ◊   - upload event
 * @param  {String}  s3Object - the file data
 * @return {Promise}          resolves when validation complete
 */
const validateS3Object = async (evt, s3Object) => {
  const { subtype } = evt;
  const adapter = uploadAdapters[subtype];
  const { isValid, validationErrors } = await adapter.validator(s3Object.Body);
  if (!isValid) {
    const err = new Error('Failed Schema Validation', validationErrors);
    if (validationErrors) {
      const dateErrors = validationErrors.filter(e => e.message === 'Unexpected date format for return line');
      err.key = (dateErrors.length > 0) ? errorEvent.keys.INVALID_DATE : errorEvent.keys[subtype].INVALID;
    } else {
      err.key = errorEvent.keys[subtype].INVALID;
    }

    throw err;
  }
};

/**
 * Handler for the 'return-upload' job in PG Boss.
 *
 * This will acquire the saved document from AWS S3
 * and validate it against a required schema.
 *
 * @param {Object} job The job data from PG Boss
 */
const handleReturnsUploadStart = async job => {
  const { eventId } = job.data;
  const evt = await event.load(eventId);

  try {
    const s3Object = await returnsUpload.getReturnsS3Object(eventId, evt.subtype);

    // Pass parsed xml or csv doc to the validation function
    // returns true if the validation passes
    // returns an array of objects containing error messages and lines
    await validateS3Object(evt, s3Object);

    return job.done();
  } catch (error) {
    logger.error('Returns upload failure', error, { job });

    await errorEvent.setEventError(evt, error);
    return job.done(error);
  }
};

exports.publish = publishReturnsUploadStart;
exports.handler = handleReturnsUploadStart;
exports.jobName = JOB_NAME;
