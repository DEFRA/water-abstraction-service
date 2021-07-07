// Syncs licence linkages from Digitise data with the into `water.licence_gauging_stations`
'use strict';

// Dependencies
const moment = require('moment');
const { logger } = require('../../../logger');

// Constants
const JOB_NAME = 'gauging-stations.copy-licence-gauging-stations-from-digitise';

// Handy stuff
const config = require('../../../../config');

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      every: config.import.digitiseToLicenceGaugingStationsFrequencyInMS
    }
  }
]);

const handler = async () => {
  logger.info(`${JOB_NAME}: Job has started`);
// do stuff
};

const onFailedHandler = async (job, err) => {
  logger.error(`${JOB_NAME}: Job has failed`, err);
};

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`);
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onFailed = onFailedHandler;
exports.onComplete = onComplete;
exports.hasScheduler = true;
