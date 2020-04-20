const { setImportStatus, PENDING_JOB_STATUS } = require('../lib/import-log.js');
const logger = require('./lib/logger');

const importLicenceComplete = async job => {
  logger.logHandlingOnCompleteJob(job);

  const { licenceNumber } = job.data.request.data;

  const message = job.failed ? 'Error' : 'OK';

  return setImportStatus(licenceNumber, message, PENDING_JOB_STATUS.complete);
};

module.exports = importLicenceComplete;
