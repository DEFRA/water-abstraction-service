const { setImportStatus, PENDING_JOB_STATUS } = require('../lib/import-log.js');
const logger = require('./lib/logger');

const options = {
  teamSize: 50
};

const importLicenceComplete = async job => {
  logger.logHandlingOnCompleteJob(job);

  const { licenceNumber } = job.data.request.data;

  const message = job.failed ? 'Error' : 'OK';

  return setImportStatus(licenceNumber, message, PENDING_JOB_STATUS.complete);
};

exports.handler = importLicenceComplete;
exports.options = options;
