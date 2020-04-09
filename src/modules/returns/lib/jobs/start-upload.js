const JOB_NAME = 'returns-upload';
const { logger } = require('../../../../logger');
const returnsUpload = require('../returns-upload');
const errorEvent = require('./error-event');
const uploadAdapters = require('../upload-adapters');
const eventsService = require('../../../../lib/services/events');

/**
 * Creates a message for PG Boss
 * @param {Event} event
 * @param {String} companyId
 * @returns {Object} PG boss message
 */
const createMessage = (event, companyId) => ({
  name: JOB_NAME,
  data: {
    eventId: event.id,
    subtype: event.subtype,
    companyId
  }
});

const getValidationError = (validationErrors, subtype) => {
  if (!validationErrors) return errorEvent.keys[subtype].INVALID;
  const dateErrors = validationErrors.filter(e => e.message === 'Unexpected date format for return line');
  return (dateErrors.length > 0) ? errorEvent.keys.INVALID_DATE : errorEvent.keys[subtype].INVALID;
};
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
    err.key = getValidationError(validationErrors, subtype);

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

  const event = await eventsService.findOne(eventId);
  if (!event) return errorEvent.throwEventNotFoundError(eventId);

  try {
    const s3Object = await returnsUpload.getReturnsS3Object(eventId, event.subtype);

    // Pass parsed xml or csv doc to the validation function
    // returns true if the validation passes
    // returns an array of objects containing error messages and lines
    await validateS3Object(event, s3Object);
  } catch (error) {
    logger.error('Returns upload failure', error, { job });

    await errorEvent.setEventError(event, error);
    throw error;
  }
};

exports.createMessage = createMessage;
exports.handler = handleReturnsUploadStart;
exports.jobName = JOB_NAME;
