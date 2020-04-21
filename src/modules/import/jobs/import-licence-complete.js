'use strict';

const importLog = require('../lib/import-log.js');
const logger = require('./lib/logger');

const options = {
  teamSize: 50
};

const importLicenceComplete = async job => {
  if (job.failed) {
    logger.logFailedJob(job);
  }

  logger.logHandlingOnCompleteJob(job);

  const { licenceNumber } = job.data.request.data;

  const message = job.failed ? 'Error' : 'OK';

  return importLog.setImportStatus(licenceNumber, message, importLog.PENDING_JOB_STATUS.complete);
};

exports.handler = importLicenceComplete;
exports.options = options;
