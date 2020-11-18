'use strict';

const { get, partial } = require('lodash');

const JOB_NAME = 'billing.process-charge-versions';

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const { jobName: processChargeVersionYearJobName } = require('./process-charge-version-year');
const batchStatus = require('./lib/batch-status');
const chargeVersionYearService = require('../services/charge-version-year');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const handler = async job => {
  batchJob.logHandling(job);

  const batchId = get(job, 'data.batchId');

  try {
    // Load batch
    const batch = await batchService.getBatchById(batchId);

    // Check batch in "processing" status
    batchStatus.assertBatchIsProcessing(batch);

    // Get all charge version years for processing
    const billingBatchChargeVersionYears = await chargeVersionYearService.getForBatch(batch.id);

    return {
      batch,
      billingBatchChargeVersionYears
    };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToProcessChargeVersions);
    throw err;
  }
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);

  try {
    const { batch, billingBatchChargeVersionYears } = job.returnvalue;

    // Publish a job to process each charge version year
    for (const billingBatchChargeVersionYear of billingBatchChargeVersionYears) {
      await queueManager.add(processChargeVersionYearJobName, batch, billingBatchChargeVersionYear);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
