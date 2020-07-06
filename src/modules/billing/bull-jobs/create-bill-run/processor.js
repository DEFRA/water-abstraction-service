'use strict';

const { get } = require('lodash');

const batchService = require('../../services/batch-service');
const logger = require('../lib/logger');

/**
 * Job handler - creates bill run in charge module
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);
  const batchId = get(job, 'data.batch.id');
  const batch = await batchService.createChargeModuleBillRun(batchId);
  return {
    batch
  };
};

module.exports = jobHandler;
