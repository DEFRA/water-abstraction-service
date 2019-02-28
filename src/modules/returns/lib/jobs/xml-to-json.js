const messageQueue = require('../../../../lib/message-queue');
const JOB_NAME = 'returns-upload-xml-to-json';
const s3 = require('../../../../lib/connectors/s3');
const event = require('../../../../lib/event');
const returnsUpload = require('../returns-upload');
const uploadStatus = returnsUpload.uploadStatus;
const { logger } = require('@envage/water-abstraction-helpers');
const xmlToJsonMapping = require('../../lib/xml-to-json-mapping');
const { parseXmlFile } = require('../../lib/xml-helpers');
const idmConnector = require('../../../../lib/connectors/idm');
const errorEvent = require('./error-event');

/**
 * Begins the returns XML to JSON process by adding a new task to PG Boss.
 *
 * @param {string} eventId The UUID of the event
 * @returns {Promise}
 */
const publishReturnsXmlToJsonStart = eventId =>
  messageQueue.publish(JOB_NAME, returnsUpload.buildJobData(eventId));

const validateUser = user => {
  if (!user) {
    const err = new Error('User not found');
    err.key = errorEvent.keys.USER_NOT_FOUND;
    throw err;
  }
};

const xmlToJson = async (s3Object, user) => {
  try {
    const xml = parseXmlFile(s3Object.Body);
    const json = await xmlToJsonMapping.mapXml(xml, user);
    return json;
  } catch (error) {
    error.key = errorEvent.keys.XML_TO_JSON_MAPPING;
    throw error;
  }
};

/**
 * Handler for the 'return-upload-xml-to-json' job in PG Boss.
 *
 * This will acquire the saved document from AWS S3,
 * convert the XML to a JSON representation, then put the JSON
 * back to S3 for future processing.
 *
 * @param {Object} job The job data from PG Boss
 */
const handleReturnsXmlToJsonStart = async job => {
  const evt = await event.load(job.data.eventId);

  try {
    const [s3Object, user] = await Promise.all([
      returnsUpload.getReturnsS3Object(job.data.eventId),
      idmConnector.usersClient.getUserByUserName(evt.issuer)
    ]);

    validateUser(user);

    const json = await xmlToJson(s3Object, user);
    await uploadJsonToS3(evt.eventId, json);

    evt.status = uploadStatus.VALIDATED;
    await event.save(evt);

    return job.done();
  } catch (error) {
    logger.error('Failed to convert XML to JSON', error, { job });
    await errorEvent.setEventError(evt, error);
    return job.done(error);
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
  return s3.upload(jsonFileName, Buffer.from(json, 'utf8'));
};

exports.publish = publishReturnsXmlToJsonStart;
exports.handler = handleReturnsXmlToJsonStart;
exports.jobName = JOB_NAME;
