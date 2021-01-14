'use strict';

const { get, partial } = require('lodash');

const JOB_NAME = 'billing.create-bill-run';

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');

const { jobName: populateBatchChargeVersionJobName } = require('./populate-batch-charge-versions');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const handler = async job => {
  batchJob.logHandling(job);
  const batchId = get(job, 'data.batchId');

  try {
    const batch = await batchService.createChargeModuleBillRun(batchId);
    return { batchId: batch.id };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToCreateBillRun);
    throw err;
  }
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);
  try {
    // Publish next job in process
    const batchId = get(job, 'data.batchId');
    await queueManager.add(populateBatchChargeVersionJobName, batchId);
  } catch (err) {
    batchJob.logOnCompleteError(job);
  }
};

exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
