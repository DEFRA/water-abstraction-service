'use strict';

const { get } = require('lodash');
const JOB_NAME = 'new-LicenceVersion';
const chargeVersionWorkflowService = require('../services/charge-version-workflows');
const { logger } = require('../../../logger');
const licences = require('../../../lib/services/licences');
const ChargeVersion = require('../../../lib/models/charge-version');
const User = require('../../../lib/models/user');
const uuid = require('uuid');

const createMessage = (licenceVersionId, licenceId) => {
  return [
    JOB_NAME,
    { licenceVersionId, licenceId },
    {
      jobId: `${JOB_NAME}.${licenceVersionId}`,
      attempts: 6,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  ];
};

const handler = async job => {
  logger.info(`Handling: ${job.id}`);
  const licenceVersionId = get(job, 'data.licenceVersionId');
  const licenceId = get(job, 'data.licenceId');
  // @todo - created at the momen to pass assertions on the chargeVersionWorkFlow model
  const emptyChargeVersion = new ChargeVersion(uuid());
  const emptyUser = new User(1, 'water@wrls.com');

  try {
    const licence = await licences.getLicenceById(licenceId);
    const chargeVersionWorkflow = await chargeVersionWorkflowService.create(licence, licenceVersionId, emptyChargeVersion, emptyUser);
    return { chargeVersionWorkflowId: chargeVersionWorkflow.id };
  } catch (err) {
    logger.error(`Error handling: ${job.id}`, err, job.data);
    throw err;
  }
};

const onComplete = async (job) => {
  logger.info(`onComplete: ${job.id}`);
  try {
  } catch (err) {
    logger.error(`Error handling onComplete: ${job.id}`, err, job.data);
  }
};

const onFailed = (job, err) => {
  logger.error(`Job ${job.name} ${job.id} failed`, err);
};

exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = onFailed;
exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
