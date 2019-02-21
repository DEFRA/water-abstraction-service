const messageQueue = require('../../../../lib/message-queue');
const JOB_NAME = 'returns-upload-xml-to-json';
const s3 = require('../../../../lib/connectors/s3');
const event = require('../../../../lib/event');
const returnsUpload = require('../returns-upload');
const uploadStatus = returnsUpload.uploadStatus;
const { logger } = require('@envage/water-abstraction-helpers');
const { mapXml } = require('../../lib/xml-to-json-mapping');
const { parseXmlFile } = require('../../lib/xml-helpers');

const updateEventStatus = (evt, isSuccess) => {
  evt.status = uploadStatus.VALIDATED;

  if (!isSuccess) {
    evt.status = uploadStatus.ERROR;
    evt.comment = 'XML to JSON conversion failed';
  }
  return event.save(evt);
};

/**
 * Begins the returns XML to JSON process by adding a new task to PG Boss.
 *
 * @param {string} eventId The UUID of the event
 * @returns {Promise}
 */
const publishReturnsXmlToJsonStart = eventId =>
  messageQueue.publish(JOB_NAME, returnsUpload.buildJobData(eventId));

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
    const s3Object = await returnsUpload.getReturnsS3Object(job.data.eventId);

    const json = mapXml(parseXmlFile(s3Object.Body));

    await uploadJsonToS3(evt.eventId, json);
    await updateEventStatus(evt, true);
    return job.done();
  } catch (error) {
    logger.error('Failed to convert XML to JSON', error, { job });
    await updateEventStatus(evt, false);
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
