const JOB_NAME = 'charge-information-upload-start';
const { logger } = require('../../../logger');
const chargeInformationUpload = require('../lib/charge-information-upload');
const errorEvent = require('../lib/error-event');
const csvAdapter = require('../lib/csv-adapter');
const eventsService = require('../../../lib/services/events');
const mapToJson = require('./update-charge-information-to-json');
const { getUploadErrorFilename } = require('../lib/charge-information-upload');
const s3 = require('../../../lib/services/s3');
const { set } = require('lodash');
const helpers = require('../lib/helpers');

/**
 * Creates a message for Bull MQ
 * @param {Event} event
 * @returns {Object}
 */
const createMessage = event => {
  logger.info(`Create Message ${JOB_NAME}`);
  return [
    JOB_NAME,
    {
      eventId: event.id,
      filename: event.filename
    },
    {
      jobId: `${JOB_NAME}.${event.id}`
    }
  ];
};

/**
 * Validates the object from the S3 bucket using an appropriate adatper
 * If validation errors are found, an error is thrown with a key which
 * allows the error type to be stored in the event metadata
 * @param  {String}  s3Object - the file data
 * @return {Promise}          resolves when validation complete
 */
const validateS3Object = async s3Object => {
  const { isValid, validationErrors, errorType } = await csvAdapter.validator(s3Object.Body);
  if (!isValid) {
    const err = new Error('Failed Schema Validation');
    const { INVALID, INVALID_ROWS } = errorEvent.keys.csv;
    err.key = errorType === 'rows' ? INVALID_ROWS : INVALID;
    err.validationErrors = validationErrors;
    throw err;
  }
};

const uploadErrorFile = async (event, error) => {
  try {
    const uploadFilename = getUploadErrorFilename(event);
    const data = error.validationErrors.join('\n');
    await s3.upload(uploadFilename, data);
  } catch (err) {
    console.log(err);
  }
};

/**
 * Handler for the 'return-upload' job in Bull MQ.
 *
 * This will acquire the saved document from AWS S3
 * and validate it against a required schema.
 *
 * @param {Object} job The job data from Bull MQ
 */
const handleChargeInformationUploadStart = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`);
  const { eventId } = job.data;

  const event = await eventsService.findOne(eventId);
  if (!event) {
    return errorEvent.throwEventNotFoundError(eventId);
  }

  try {
    helpers.clearCache();
    set(event.metadata, 'statusMessage', 'validating csv');
    await eventsService.update(event);
    const s3Object = await chargeInformationUpload.getChargeInformationS3Object(event);
    // Pass parsed csv file to the validation function
    // returns true if the validation passes
    return await validateS3Object(s3Object);
  } catch (error) {
    logger.error('Charge information upload failure', error, { job });
    if (error.key === errorEvent.keys.csv.INVALID_ROWS) {
      await uploadErrorFile(event, error);
      error.validationErrors = ['Invalid row data'];
    }
    await errorEvent.setEventError(event, error);
    throw error;
  }
};

const onFailed = async (_job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async (job, queueManager) => {
  // Format and add BullMQ message
  await queueManager.add(mapToJson.jobName, job.data);
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.createMessage = createMessage;
exports.handler = handleChargeInformationUploadStart;
exports.onFailed = onFailed;
exports.onComplete = onComplete;
exports.jobName = JOB_NAME;
