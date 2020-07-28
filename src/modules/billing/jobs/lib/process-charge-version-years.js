'use strict';

const batchJob = require('./batch-job');
const processChargeVersionJob = require('../process-charge-version');
const chargeVersionYearService = require('../../services/charge-version-year');

/**
 * Designed to be used in a PG boss on-complete handler
 * Based on the batch ID found in the PG Boss job, gets all records from
 * water.billing_batch_charge_version_years and publishes a job to process each
 *
 * @param {Object} job - PG boss job
 * @param {Object} messageQueue - PG boss message queue
 */
const processChargeVersionYears = async (job, messageQueue) => {
  try {
    const { eventId, batch } = job.data.request.data;

    const billingBatchChargeVersionYears = await chargeVersionYearService.getForBatch(batch.id);

    // Otherwise publish a job to process each
    for (const billingBatchChargeVersionYear of billingBatchChargeVersionYears) {
      const message = processChargeVersionJob.createMessage(eventId, billingBatchChargeVersionYear, batch);
      await messageQueue.publish(message);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

exports.processChargeVersionYears = processChargeVersionYears;
