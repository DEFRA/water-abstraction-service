'use strict';

const { partial, get } = require('lodash');

const JOB_NAME = 'billing.populate-batch-charge-versions';

const batchService = require('../services/batch-service');
const chargeVersionService = require('../services/charge-version-service');

const { BATCH_ERROR_CODE, BATCH_TYPE } = require('../../../lib/models/batch');
const helpers = require('./lib/helpers');
const batchJob = require('./lib/batch-job');

const { jobName: processChargeVersionsJobName } = require('./process-charge-versions');
const { jobName: twoPartTariffMatchingJobName } = require('./two-part-tariff-matching');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const handler = async job => {
  batchJob.logHandling(job);
  const batchId = get(job, 'data.batchId');

  try {
    const batch = await batchService.getBatchById(batchId);

    // Populate water.billing_batch_charge_version_years
    await chargeVersionService.createForBatch(batch);

    return { batch };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPopulateChargeVersions);
    throw err;
  }
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);

  try {
    const { batch } = job.returnvalue;

    if (batch.type === BATCH_TYPE.annual) {
      await queueManager.add(processChargeVersionsJobName, batch.id);
    } else {
      // Two-part tariff matching for TPT/supplementary run
      await queueManager.add(twoPartTariffMatchingJobName, batch.id);
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
