const JOB_NAME = 'update-charge-information';
const chargeInformationUpload = require('../lib/charge-information-upload');
const eventsService = require('../../../lib/services/events');
const errorEvent = require('../lib/error-event');
const { logger } = require('../../../logger');
const { set } = require('lodash');

/**
 * Creates a message for Bull MQ
 * @param {Object} data containing eventId and companyId
 * @return {Object}
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

/**
 * Load return JSON from S3 bucket
 * @type {Object}
 */
const loadJson = async event => {
  const response = await chargeInformationUpload.getChargeInformationS3Object(event, 'json');
  return JSON.parse(response.Body.toString());
};

/**
 * Handler for the 'update-charge-information' job in Bull MQ.
 *
 * This will acquire the JSON from AWS S3,
 * validate the JSON representation, then process that data to update the charge information.
 *
 * @param {Object} job The job data from Bull MQ
 */
const handleUpdateChargeInformation = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`);
  const { eventId } = job.data;
  const event = await eventsService.findOne(eventId);
  if (!event) {
    return errorEvent.throwEventNotFoundError(eventId);
  }

  try {
    const jsonData = await loadJson(event);
    // process the json data and apply the new charge versions to the db see: https://eaflood.atlassian.net/browse/WATER-3551
    console.log('**** Creation and Update of Charge versions will happen here ****');
    console.log(JSON.stringify(jsonData), null, 2);
    set(event, 'status', chargeInformationUpload.uploadStatus.READY);
    return await eventsService.update(event);
  } catch (error) {
    logger.error('Creation and Update of Charge versions failed', error, { eventId });
    await errorEvent.setEventError(event, error);
    throw error;
  }
};

const onFailed = async (_job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.createMessage = createMessage;
exports.handler = handleUpdateChargeInformation;
exports.onFailed = onFailed;
exports.onComplete = onComplete;
exports.jobName = JOB_NAME;
