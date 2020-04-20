'use strict';

const { clearImportLog } = require('../lib/import-log');
const { downloadAndExtract } = require('../extract');
const logger = require('./lib/logger');

const JOB_NAME = 'import.s3-download';

const createMessage = licenceNumber => ({
  name: JOB_NAME,
  options: {
    expireIn: '1 hours',
    singletonKey: JOB_NAME
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
    await clearImportLog();
    await downloadAndExtract();
  } catch (err) {
    logger.logJobError(job, err);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handler;
exports.jobName = JOB_NAME;
