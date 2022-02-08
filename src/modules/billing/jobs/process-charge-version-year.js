'use strict';

const { get } = require('lodash');

const JOB_NAME = 'billing.process-charge-version-year';

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const chargeVersionYearService = require('../services/charge-version-year');
const billingVolumeService = require('../services/billing-volumes-service');
const { jobName: prepareTransactionsJobName } = require('./prepare-transactions');
const helpers = require('./lib/helpers');

const createMessage = (batchId, billingBatchChargeVersionYearId) => ([
  JOB_NAME,
  {
    batchId,
    billingBatchChargeVersionYearId
  },
  {
    jobId: `${JOB_NAME}.${batchId}.${billingBatchChargeVersionYearId}`
  }
]);

const handler = async job => {
  batchJob.logHandling(job);

  const chargeVersionYearId = get(job, 'data.billingBatchChargeVersionYearId');

  try {
    // Load charge version year
    const chargeVersionYear = await chargeVersionYearService.getChargeVersionYearById(chargeVersionYearId);
    // Process charge version year
    const batch = await chargeVersionYearService.processChargeVersionYear(chargeVersionYear);

    // Persist data
    await batchService.saveInvoicesToDB(batch);

    // Update status in water.billing_batch_charge_version_year
    await chargeVersionYearService.setReadyStatus(chargeVersionYearId);

    // Check how many records left to process
    const { processing } = await chargeVersionYearService.getStatusCounts(batch.id);
    if (processing === 0) {
      // Check if batch requires TPT review
      const numberOfUnapprovedBillingVolumes = await billingVolumeService.getUnapprovedVolumesForBatchCount(batch);
      if (numberOfUnapprovedBillingVolumes > 0) {
        const updatedbatch = await batchService.setStatus(batch.id, BATCH_STATUS.review);
        return { processing, batch: updatedbatch };
      }
    }

    return {
      batch,
      processing
    };
  } catch (err) {
    await chargeVersionYearService.setErrorStatus(chargeVersionYearId);
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToProcessChargeVersions);
    throw err;
  }
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);

  try {
    const { batch, processing } = job.returnvalue;

    // When all charge version years are processed, add next job
    if (processing === 0 && (batch.status === BATCH_STATUS.processing)) {
      await queueManager.add(prepareTransactionsJobName, batch.id);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onFailed = helpers.onFailedHandler;
exports.onComplete = onComplete;
exports.workerOptions = {
  lockDuration: 3600000,
  lockRenewTime: 3600000 / 2
};
