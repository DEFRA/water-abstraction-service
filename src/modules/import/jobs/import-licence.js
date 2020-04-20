'use strict';

const importLog = require('../lib/import-log.js');
const licenceLoader = require('../load');
const logger = require('./lib/logger');
const assertImportTableExists = require('../lib/assert-import-tables-exist');

const JOB_NAME = 'import.licence';

const options = {
  teamSize: 50
};

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
    await assertImportTableExists.assertImportTableExists();

    const { licenceNumber } = job.data;

    // Mark as importing the licence
    await importLog.setImportStatus(licenceNumber, 'Importing', importLog.PENDING_JOB_STATUS.processing);

    // Import the licence
    await licenceLoader.load(licenceNumber);
  } catch (err) {
    logger.logJobError(job, err);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handler;
exports.jobName = JOB_NAME;
exports.options = options;
