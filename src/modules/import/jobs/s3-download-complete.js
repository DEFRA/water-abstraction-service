'use strict';

const logger = require('./lib/logger');

const populatePendingImportJob = require('./populate-pending-import');
const importLicenceJob = require('./import-licence');

const s3DownloadComplete = async (job, messageQueue) => {
  if (job.failed) {
    return logger.logFailedJob(job);
  }

  logger.logHandlingOnCompleteJob(job);

  try {
    const { isRequired } = job.data.response;

    if (!isRequired) {
      return logger.logAbortingOnComplete(job);
    }

    // Delete existing PG boss import queues
    await Promise.all([
      messageQueue.deleteQueue(importLicenceJob.jobName),
      messageQueue.deleteQueue(populatePendingImportJob.jobName)
    ]);

    // Publish a new job to populate pending import table
    await messageQueue.publish(populatePendingImportJob.createMessage());
  } catch (err) {
    logger.logHandlingOnCompleteError(job, err);
    throw err;
  }
};

module.exports = s3DownloadComplete;
