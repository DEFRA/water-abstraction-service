'use strict';

const licenceLoader = require('../load');
const logger = require('./lib/logger');
const assertImportTablesExist = require('../lib/assert-import-tables-exist');

const JOB_NAME = 'import.licence';

const options = {
  teamSize: 100,
  teamConcurrency: 1
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
    await assertImportTablesExist.assertImportTablesExist();

    const { licenceNumber } = job.data;

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
