'use strict';
const applicationStateService = require('../services/application-state-service');
const s3Service = require('../services/s3-service');
const extractService = require('../services/extract-service');
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
 * Gets status of file in S3 bucket and current application state
 * @return {Promise<Object>}
 */
const getStatus = async () => {
  const [etag, state] = await Promise.all([
    s3Service.getEtag(),
    applicationStateService.get()
  ]);
  return {
    etag,
    state,
    isRequired: !state.isDownloaded || (etag !== state.etag)
  };
};

/**
 * Imports a single licence
 * @param {Object} job
 * @param {String} job.data.licenceNumber
 */
const handler = async job => {
  logger.logHandlingJob(job);

  try {
    const status = await getStatus();

    if (status.isRequired) {
      await applicationStateService.save(status.etag);
      await extractService.downloadAndExtract();
      await applicationStateService.save(status.etag, true);
    }

    return status;
  } catch (err) {
    logger.logJobError(job, err);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handler;
exports.jobName = JOB_NAME;
