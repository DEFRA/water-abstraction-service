'use strict';

const { get } = require('lodash');

const chargeVersionYearService = require('../services/charge-version-year');
const batchJob = require('./lib/batch-job');
const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

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
    singletonKey: chargeVersionYear.billingBatchChargeVersionYearId
  });
};

const handleProcessChargeVersion = async job => {
  batchJob.logHandling(job);

  const chargeVersionYearId = get(job, 'data.chargeVersionYear.billingBatchChargeVersionYearId');

  try {
    // Load charge version year
    const chargeVersionYear = await chargeVersionYearService.getChargeVersionYearById(chargeVersionYearId);
    // Process charge version year
    const batch = await chargeVersionYearService.processChargeVersionYear(chargeVersionYear);

    // Persist data
    await batchService.saveInvoicesToDB(batch);

    // Update status in water.billing_batch_charge_version_year
    await chargeVersionYearService.setReadyStatus(chargeVersionYearId);

    return {
      chargeVersionYear,
      batch: job.data.batch
    };
  } catch (err) {
    await chargeVersionYearService.setErrorStatus(chargeVersionYearId);
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToProcessChargeVersions);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handleProcessChargeVersion;
exports.jobName = JOB_NAME;
exports.options = options;
