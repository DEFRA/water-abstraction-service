const messageQueue = require('../../../../lib/message-queue');
const JOB_NAME = 'returns-upload';
const event = require('../../../../lib/event');
const { uploadStatus } = require('../returns-upload');
const { logger } = require('@envage/water-abstraction-helpers');
const returnsUpload = require('../../lib/returns-upload');
const { validateXml } = require('../../lib/schema-validation');
const { parseXmlFile } = require('../../lib/xml-helpers');

/**
 * Begins the XML returns process by adding a new task to PG Boss.
 *
 * @param {string} eventId The UUID of the event
 * @returns {Promise}
 */
const publishReturnsUploadStart = eventId =>
  messageQueue.publish(JOB_NAME, returnsUpload.buildJobData(eventId));

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
    const result = await validateXml(parseXmlFile(s3Object.Body));
    if (result !== true) throw new Error('Failed Schema Validation');

    return job.done();
  } catch (error) {
    logger.error('Returns upload failure', error, { job });

    evt.status = uploadStatus.ERROR;
    evt.comment = 'Validation Failed';
    await event.save(evt);
    return job.done(error);
  }
};

exports.publish = publishReturnsUploadStart;
exports.handler = handleReturnsUploadStart;
exports.jobName = JOB_NAME;
