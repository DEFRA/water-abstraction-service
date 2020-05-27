'use strict';

const logger = require('./lib/logger');
const importLicenceJob = require('./import-licence');

const importLicenceComplete = async (job, messageQueue) => {
  if (job.failed) {
    return logger.logFailedJob(job);
  }

  logger.logHandlingOnCompleteJob(job);

  try {
    const { licenceNumbers } = job.data.response;
    for (const licenceNumber of licenceNumbers) {
      await messageQueue.publish(importLicenceJob.createMessage(licenceNumber));
    }
  } catch (err) {
    logger.logHandlingOnCompleteError(job, err);
    throw err;
  }
};

module.exports = importLicenceComplete;
