'use strict';

const importLog = require('../lib/import-log.js');
const logger = require('./lib/logger');
const assertImportTableExists = require('../lib/assert-import-tables-exist');

const JOB_NAME = 'import.populate-pending-import';

const createMessage = () => ({
  name: JOB_NAME,
  options: {
    expireIn: '1 hours',
    singletonKey: JOB_NAME
  }
});

const mapLicenceNumbers = data => data.map(row => row.licence_ref);

/**
 * Imports a single licence
 * @param {Object} job
 * @param {String} job.data.licenceNumber
 */
const handler = async job => {
  logger.logHandlingJob(job);

  try {
    await assertImportTableExists.assertImportTableExists();

    await importLog.clearImportLog();
    const pendingImports = await importLog.createImportLog();
    return {
      licenceNumbers: mapLicenceNumbers(pendingImports)
    };
  } catch (err) {
    logger.logJobError(job, err);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handler;
exports.jobName = JOB_NAME;
