const JOB_NAME = 'charge-information-upload-to-json';
const s3 = require('../../../lib/services/s3');
const eventsService = require('../../../lib/services/events');
const chargeInformationUpload = require('../lib/charge-information-upload');
const uploadStatus = chargeInformationUpload.uploadStatus;
const { logger } = require('../../../logger');
const idmConnector = require('../../../lib/connectors/idm');
const errorEvent = require('../lib/error-event');
const csvAdapter = require('../lib/csv-adapter');
const config = require('../../../../config');
const validateChargeInformation = require('./update-charge-information-save');
const helpers = require('../lib/helpers');

/**
 * Creates a message for Bull MQ
 * @param {Object} data containing eventId and companyId
 * @returns {Object}
 */
const createMessage = data => {
  logger.info(`Create Message ${JOB_NAME}`);
  return [
    JOB_NAME,
    data,
    {
      jobId: `${JOB_NAME}.${data.eventId}`
    }
  ];
};

const validateUser = user => {
  if (!user) {
    const err = new Error('User not found');
    err.key = errorEvent.keys.USER_NOT_FOUND;
    throw err;
  }
};

const updateChargeInformationToJson = async (evt, s3Object, user) => {
  try {
    return await csvAdapter.mapper(s3Object.Body, user, evt);
  } catch (error) {
    error.key = errorEvent.keys.csv.MAPPING;
    throw error;
  }
};

/**
 * Handler for the 'charge-information-upload-to-json' job in Bull MQ.
 *
 * This will acquire the saved document from AWS S3,
 * convert the CSV to a JSON representation, then put the JSON
 * back to S3 for future processing.
 *
 * @param {Object} job The job data from Bull MQ
 */
const handleChargeInformationMapToJsonStart = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`);
  const event = await eventsService.findOne(job.data.eventId);
  if (!event) {
    return errorEvent.throwEventNotFoundError(job.data.eventId);
  }

  const { filename } = event.metadata;

  try {
    helpers.clearCache();

    const application = config.idm.application.internalUser;

    const [s3Object, user] = await Promise.all([
      chargeInformationUpload.getChargeInformationS3Object(event),
      idmConnector.usersClient.getUserByUsername(event.issuer, application)
    ]);

    validateUser(user);

    const json = await updateChargeInformationToJson(event, s3Object, user);

    await uploadJsonToS3(event, json);

    event.status = uploadStatus.VALIDATED;
    return await eventsService.update(event);
  } catch (error) {
    logger.error(`Failed to convert ${filename} to JSON`, error, { job });
    await errorEvent.setEventError(event, error);
    throw error;
  }
};

/**
 * Persists a JSON string to S3 using the eventid as the filename/S3 key.
 *
 * @param {Object} event the event
 * @param {string} json The JSON string to persist to S3
 * @returns {Promise} Response from s3.upload
 */
const uploadJsonToS3 = (event, json) => {
  const jsonFileName = chargeInformationUpload.getUploadFilename(event, 'json');
  const str = JSON.stringify(json, null, 2);
  return s3.upload(jsonFileName, Buffer.from(str, 'utf8'));
};

const onFailed = async (_job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async (job, queueManager) => {
  // Format and add BullMQ message
  const { eventId } = job.data;
  await queueManager.add(validateChargeInformation.jobName, { eventId });
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.createMessage = createMessage;
exports.handler = handleChargeInformationMapToJsonStart;
exports.onFailed = onFailed;
exports.onComplete = onComplete;
exports.jobName = JOB_NAME;
