const JOB_NAME = 'update-charge-information-save';
const chargeInformationUpload = require('../lib/charge-information-upload');
const eventsService = require('../../../lib/services/events');
const licenceService = require('../../../lib/services/licences');
const chargeVersionService = require('../../../lib/services/charge-versions');
const errorEvent = require('../lib/error-event');
const { logger } = require('../../../logger');
const { set } = require('lodash');
const saveJsonHelper = require('../save-json');
const chargeVersionMapper = require('../../../lib/mappers/charge-version');
const userMapper = require('../../../lib/mappers/user');
const helpers = require('../lib/helpers');

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

const saveChargeVersion = async data => {
  const licence = await licenceService.getLicenceByLicenceRef(data.licenceRef);
  const chargeVersion = chargeVersionMapper.pojoToModel({ ...data.chargeVersion, licenceRef: data.licenceRef });
  const createdBy = userMapper.pojoToModel(data.user);

  chargeVersion.fromHash({
    createdBy: createdBy,
    approvedBy: createdBy,
    region: licence.region,
    licence
  });

  // Persist the new charge version
  return chargeVersionService.create(chargeVersion);
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

    // Save the json file in a temporary folder for development purposes
    saveJsonHelper.saveJson(event, jsonData);

    // Process each charge version one at a time to prevent overloading
    do {
      const data = jsonData.shift();
      logger.info(`${JOB_NAME}: Saving charge version for ${data.licenceRef}`);
      await saveChargeVersion(data);
      const statusMessage = `${jsonData.length} charge versions remaining to save`;
      logger.info(`${JOB_NAME}: ${statusMessage}`);
      await helpers.updateEventStatus(event, statusMessage);
    } while (jsonData.length);

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
