const JOB_NAME = 'returns-upload-to-json';
const s3 = require('../../../../lib/services/s3');
const eventsService = require('../../../../lib/services/events');
const returnsUpload = require('../returns-upload');
const uploadStatus = returnsUpload.uploadStatus;
const { logger } = require('../../../../logger');
const idmConnector = require('../../../../lib/connectors/idm');
const errorEvent = require('./error-event');
const uploadAdapters = require('../upload-adapters');
const config = require('../../../../../config');
const validateReturns = require('./validate-returns');

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

const validateUser = user => {
  if (!user) {
    const err = new Error('User not found');
    err.key = errorEvent.keys.USER_NOT_FOUND;
    throw err;
  }
};

const mapToJson = async (evt, s3Object, user) => {
  const { subtype } = evt;
  try {
    const adapter = uploadAdapters[subtype];
    const json = await adapter.mapper(s3Object.Body, user);
    return json;
  } catch (error) {
    error.key = errorEvent.keys[subtype].MAPPING;
    throw error;
  }
};

/**
 * Handler for the 'return-upload-to-json' job in Bull MQ.
 *
 * This will acquire the saved document from AWS S3,
 * convert the XML/CSV to a JSON representation, then put the JSON
 * back to S3 for future processing.
 *
 * @param {Object} job The job data from Bull MQ
 */
const handleReturnsMapToJsonStart = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`);
  const event = await eventsService.findOne(job.data.eventId);
  if (!event) return errorEvent.throwEventNotFoundError(job.data.eventId);

  try {
    const application = config.idm.application.externalUser;

    const [s3Object, user] = await Promise.all([
      returnsUpload.getReturnsS3Object(event.id, event.subtype),
      idmConnector.usersClient.getUserByUsername(event.issuer, application)
    ]);

    validateUser(user);

    const json = await mapToJson(event, s3Object, user);

    await uploadJsonToS3(event.id, json);

    await eventsService.updateStatus(event.id, uploadStatus.VALIDATED);
  } catch (error) {
    logger.error(`Failed to convert ${event.subtype} to JSON`, error, { job });
    await errorEvent.setEventError(event, error);
    throw error;
  }
};

/**
 * Persists a JSON string to S3 using the eventid as the filename/S3 key.
 *
 * @param {string} eventId the event id
 * @param {string} json The JSON string to persist to S3
 * @returns {Promise} Response from s3.upload
 */
const uploadJsonToS3 = (eventId, json) => {
  const jsonFileName = returnsUpload.getUploadFilename(eventId, 'json');
  const str = JSON.stringify(json, null, 2);
  return s3.upload(jsonFileName, Buffer.from(str, 'utf8'));
};

const onFailed = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async (job, queueManager) => {
  // Format and add BullMQ message
  const { eventId, companyId } = job.data;
  await queueManager.add(validateReturns.jobName, { eventId, companyId });
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.createMessage = createMessage;
exports.handler = handleReturnsMapToJsonStart;
exports.onFailed = onFailed;
exports.onComplete = onComplete;
exports.jobName = JOB_NAME;
