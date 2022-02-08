const { jobNames } = require('../../../lib/constants');
const JOB_NAME = jobNames.updateWithCMSummary;
const batchService = require('../../billing/services/batch-service');
const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const helpers = require('./lib/helpers');

const handler = async job => {
  try {
    const { batchId, cmResponse } = job.data;

    return batchService.updateWithCMSummary(batchId, cmResponse);
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary);
    throw err;
  }
};

const onComplete = async (job, queueManager) => batchJob.logOnComplete(job);

exports.jobName = JOB_NAME;
exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
