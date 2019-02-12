const messageQueue = require('../../../../lib/message-queue');
const JOB_NAME = 'returns-upload';
const Event = require('../../../../lib/event');
const { uploadStatus } = require('../returns-upload');
const logger = require('../../../../lib/logger');
const returnsUpload = require('../../lib/returns-upload');

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
  const evt = await Event.load(eventId);

  try {
    // Job key is the S3 key for the persisted document
    // which is currently xml only, but could be other formats
    // in the future. In which case check the sub type.
    const s3Object = await returnsUpload.getReturnsS3Object(eventId);
    console.log('Found S3 Object from Job', s3Object);

    // TODO: validate the xml schema

    return job.done();
  } catch (error) {
    error.params = { job };
    error.context = { component: 'modules/returns/lib/jobs/start-xml-upload' };
    logger.error('Returns upload failure', error);

    await evt
      .setStatus(uploadStatus.ERROR)
      .setComment('Validation Failed')
      .save();
    return job.done(error);
  }
};

exports.publish = publishReturnsUploadStart;
exports.handler = handleReturnsUploadStart;
exports.jobName = JOB_NAME;
