'use strict';

const service = require('../service');
const chargeVersionYearService = require('../services/charge-version-year');
const batchJob = require('./lib/batch-job');

const JOB_NAME = 'billing.process-charge-version.*';

const options = { teamSize: 10 };

/**
 * Creates the request object for publishing a new job for processing a
 * charge version
 *
 * @param {String} eventId The uuid of the event
 * @param {Object} chargeVersionYear The charge version year
 * @param {Object} batch The batch object
 */
const createMessage = (eventId, chargeVersionYear, batch) => {
  return batchJob.createMessage(JOB_NAME, batch, { eventId, chargeVersionYear });
};

const handleProcessChargeVersion = async job => {
  batchJob.logHandlingError(job);

  const { chargeVersionYear } = job.data;

  // Process charge version year
  try {
    // Create batch model
    const batch = await service.chargeVersionYear.createBatchFromChargeVersionYear(chargeVersionYear);

    // Persist data
    await service.chargeVersionYear.persistChargeVersionYearBatch(batch);

    // Update status in water.billing_batch_charge_version_year
    await chargeVersionYearService.setReadyStatus(chargeVersionYear.billing_batch_charge_version_year_id);

    return {
      chargeVersionYear,
      batch: job.data.batch
    };
  } catch (err) {
    batchJob.logHandlingError(job, err);

    // Mark as error
    await chargeVersionYearService.setErrorStatus(chargeVersionYear.billing_batch_charge_version_year_id);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handleProcessChargeVersion;
exports.jobName = JOB_NAME;
exports.options = options;
