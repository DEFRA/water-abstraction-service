'use strict';

const { logger } = require('../../../../logger');

const logInfo = (job, message) => {
  logger.info(`Info: ${job.id} ${message}`);
};

const logHandling = job => {
  logger.info(`Handling: ${job.id}`);
};

const logCompleted = job => {
  logger.info(`Handling onComplete: ${job.id}`);
};

const logFailed = (job, error) => {
  logger.error(`Failed: ${job.id}`, error, job.data);
};

exports.logInfo = logInfo;
exports.logHandling = logHandling;
exports.logCompleted = logCompleted;
exports.logFailed = logFailed;
