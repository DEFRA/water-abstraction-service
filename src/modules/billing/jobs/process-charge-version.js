'use strict';

const chargeVersionYearService = require('../services/charge-version-year');
const batchJob = require('./lib/batch-job');
const batchService = require('../services/batch-service');
const billingVolumesService = require('../../billing/services/billing-volumes-service');

const JOB_NAME = 'billing.process-charge-version.*';

const options = {
  teamSize: 50,
  teamConcurrency: 2
};

/**
 * Creates the request object for publishing a new job for processing a
 * charge version
 *
 * @param {String} eventId The uuid of the event
 * @param {Object} chargeVersionYear The charge version year
 * @param {Object} batch The batch object
 */
const createMessage = (eventId, chargeVersionYear, batch) => {
  return batchJob.createMessage(JOB_NAME, batch, { eventId, chargeVersionYear }, {
    singletonKey: chargeVersionYear.billing_batch_charge_version_year_id
  });
};

const handleProcessChargeVersion = async job => {
  batchJob.logHandling(job);

  const { chargeVersionYear } = job.data;

  // Process charge version year
  try {
    let batch = await chargeVersionYearService.processChargeVersionYear(chargeVersionYear);

    // If TPT, send batch to TPT processor - note batch only contains a single licence here
    if (batch.isTwoPartTariff()) {
      // @TODO: update to work with new billingVolumesService
      batch = await billingVolumesService.getVolumes(batch);
    }

    // Persist data
    await batchService.saveInvoicesToDB(batch);

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
