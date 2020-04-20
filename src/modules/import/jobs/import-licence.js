
const { setImportStatus, PENDING_JOB_STATUS } = require('../lib/import-log.js');
const { load } = require('../load');
const logger = require('./lib/logger');
const { assertImportTableExists } = require('../lib/assert-import-tables-exist');

const JOB_NAME = 'import.licence';

const createMessage = licenceNumber => ({
  name: JOB_NAME,
  data: {
    licenceNumber
  },
  options: {
    singletonKey: licenceNumber
  }
});

/**
 * Imports a single licence
 * @param {Object} job
 * @param {String} job.data.licenceNumber
 */
const handler = async job => {
  logger.logHandlingJob(job);

  try {
    await assertImportTableExists();

    const { licenceNumber } = job.data;

    // Mark as importing the licence
    await setImportStatus(licenceNumber, 'Importing', PENDING_JOB_STATUS.processing);

    // Import the licence
    await load(licenceNumber);
  } catch (err) {
    logger.logJobError(job, err);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handler;
exports.jobName = JOB_NAME;
