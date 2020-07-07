'use strict';

const { get } = require('lodash');

const batchService = require('../../services/batch-service');
const logger = require('../lib/logger');
const chargeVersionService = require('../../services/charge-version-service');
const chargeVersionYearService = require('../../services/charge-version-year');

/**
 * Job handler - populates charge versions for billing batch
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);

  // Populate water.billing_batch_charge_versions
  const batchId = get(job, 'data.batch.id');
  const batch = await batchService.getBatchById(batchId);
  await chargeVersionService.createForBatch(batch);

  // Populate water.billing_batch_charge_version_years
  const chargeVersionYears = await chargeVersionYearService.createForBatch(batch);

  return {
    batch,
    chargeVersionYears
  };
};

module.exports = jobHandler;
