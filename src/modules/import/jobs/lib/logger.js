const { logger } = require('../../../../logger');

const logHandlingJob = job =>
  logger.info(`Handling job: ${job.name}`, job.data);

const logJobError = (job, err) =>
  logger.error(`Error handling job ${job.name}`, err, job.data);

const logHandlingOnCompleteJob = job =>
  logger.info(`Handling onComplete job: ${job.data.request.name}`, job.data);

const logHandlingOnCompleteError = (job, err) =>
  logger.info(`Handling onComplete job: ${job.data.request.name}`, err, job);

exports.logHandlingJob = logHandlingJob;
exports.logHandlingOnCompleteJob = logHandlingOnCompleteJob;
exports.logJobError = logJobError;
exports.logHandlingOnCompleteError = logHandlingOnCompleteError;
