const messageQueue = require('../../../../lib/message-queue');
const JOB_NAME = 'returns-upload';
const event = require('../../../../lib/event');
const { logger } = require('@envage/water-abstraction-helpers');
const returnsUpload = require('../../lib/returns-upload');
const schemaValidation = require('../../lib/schema-validation');
const { parseXmlFile } = require('../../lib/xml-helpers');
const errorEvent = require('./error-event');

/**
 * Begins the XML returns process by adding a new task to PG Boss.
 *
 * @param {string} eventId The UUID of the event
 * @returns {Promise}
 */
const publishReturnsUploadStart = eventId =>
  messageQueue.publish(JOB_NAME, returnsUpload.buildJobData(eventId));

const validateXml = async s3Object => {
  const xml = parseXmlFile(s3Object.Body);
  const result = await schemaValidation.validateXml(xml);

  if (result !== true) {
    const err = new Error('Failed Schema Validation');
    err.key = errorEvent.keys.INVALID_XML;
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
    // Job key is the S3 key for the persisted document
    // which is currently xml only, but could be other formats
    // in the future. In which case check the sub type.
    const s3Object = await returnsUpload.getReturnsS3Object(eventId);

    // Pass parsed xml doc to the validation function
    // returns true if the validation passes
    // returns an array of objects containing error messages and lines
    await validateXml(s3Object);

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
