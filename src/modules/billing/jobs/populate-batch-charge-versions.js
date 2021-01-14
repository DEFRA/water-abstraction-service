'use strict';

const { partial, get } = require('lodash');

const JOB_NAME = 'billing.populate-batch-charge-versions';

const batchService = require('../services/batch-service');
const chargeVersionService = require('../services/charge-version-service');

const { BATCH_ERROR_CODE, BATCH_STATUS, BATCH_TYPE } = require('../../../lib/models/batch');
const helpers = require('./lib/helpers');
const batchJob = require('./lib/batch-job');

const { jobName: processChargeVersionsJobName } = require('./process-charge-versions');
const { jobName: twoPartTariffMatchingJobName } = require('./two-part-tariff-matching');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const handler = async job => {
  batchJob.logHandling(job);
  const batchId = get(job, 'data.batchId');

  try {
    console.log('ATTEMPTING  whatever this is');
    const batch = await batchService.getBatchById(batchId);

    // Populate water.billing_batch_charge_version_years
    console.log(batch);
    const billingBatchChargeVersionYears = await chargeVersionService.createForBatch(batch);
    console.log(billingBatchChargeVersionYears);
    console.log('So far so good 1');
    // If there is nothing to process, mark empty batch
    if (billingBatchChargeVersionYears.length === 0) {
      console.log('So far NOT so good 2');
      const updatedBatch = await batchService.setStatus(batchId, BATCH_STATUS.empty);
      return { batch: updatedBatch };
    }

    console.log('So far so good 3');
    return { batch };
  } catch (err) {
    console.log('pants 2');
    console.log(err);
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPopulateChargeVersions);
    throw err;
  }
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);

  try {
    const { batch } = job.returnvalue;

    // Don't do any further processing for empty batch
    if (batch.status === BATCH_STATUS.empty) {
      return;
    }

    if (batch.type === BATCH_TYPE.annual) {
      await queueManager.add(processChargeVersionsJobName, batch);
    } else {
      // Two-part tariff matching for TPT/supplementary run
      await queueManager.add(twoPartTariffMatchingJobName, batch);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
