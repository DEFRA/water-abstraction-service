const JOB_NAME = 'validate-uploaded-returns-data';
const returnsUpload = require('../../lib/returns-upload');
const eventsService = require('../../../../lib/services/events');
const errorEvent = require('./error-event');
const { logger } = require('../../../../logger');
const uploadValidator = require('../../lib/returns-upload-validator');
const { mapMultipleReturn } = require('../../lib/upload-preview-mapper');
const { set } = require('lodash');

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

/**
 * Handler for the 'validate-uploaded-returns-data' job in Bull MQ.
 *
 * This will acquire the saved document from AWS S3,
 * validate the JSON representation, then put the JSON
 * back to S3 for future processing.
 *
 * @param {Object} job The job data from Bull MQ
 */
const handleValidateReturnsStart = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`);
  const { eventId, companyId } = job.data;
  const event = await eventsService.findOne(eventId);
  if (!event) return errorEvent.throwEventNotFoundError(eventId);

  try {
    const jsonData = await loadJson(eventId);

    const validated = await uploadValidator.validate(jsonData, companyId);
    const data = validated.map(mapMultipleReturn);

    set(event, 'metadata.validationResults', getEventReturnData(data));
    set(event, 'status', returnsUpload.uploadStatus.READY);

    await eventsService.update(event);
  } catch (error) {
    logger.error('Return upload preview failed', error, { eventId, companyId });
    await errorEvent.setEventError(event, error);
    throw error;
  }
};

/**
 * Load return JSON from S3 bucket
 * @type {Object}
 */
const loadJson = async eventId => {
  const response = await returnsUpload.getReturnsS3Object(eventId, 'json');
  return JSON.parse(response.Body.toString());
};

/**
 * Maps relevant data for storing in event metadata
 * @param {Object} data return data after validation
 * @return {Array} of return data objects
 */
const getEventReturnData = data =>
  data.map(ret => ({
    returnId: ret.returnId,
    licenceNumber: ret.licenceNumber,
    isNil: ret.isNil,
    errors: ret.errors,
    totalVolume: ret.totalVolume
  }));

const onFailed = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.createMessage = createMessage;
exports.handler = handleValidateReturnsStart;
exports.onFailed = onFailed;
exports.onComplete = onComplete;
exports.jobName = JOB_NAME;
