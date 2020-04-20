'use strict';

const logger = require('./lib/logger');

const populatePendingImportJob = require('./populate-pending-import');
const importLicenceJob = require('./import-licence');

const s3DownloadComplete = async (job, messageQueue) => {
  logger.logHandlingOnCompleteJob(job);

  try {
    // Delete existing import queues
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
