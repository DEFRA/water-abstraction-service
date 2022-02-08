'use strict';

const uuid = require('uuid/v4');

const JOB_NAME = 'billing.refresh-totals';

const batchService = require('../services/batch-service');
const batchStatus = require('./lib/batch-status');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const { logger } = require('../../../logger');
const cmRefreshService = require('../services/cm-refresh-service');

const { StateError } = require('../../../lib/errors');

const createMessage = batchId => ([
  JOB_NAME,
  {
    batchId
  },
  {
    jobId: `${JOB_NAME}.${batchId}.${uuid()}`,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
]);

const handler = async job => {
  batchJob.logHandling(job);

  const { batchId } = job.data;
console.log('REfreshing the batch...')
  // Load batch
  const batch = await batchService.getBatchById(batchId);
  console.log('Got the batch...')
  // Check batch in "processing" status
  batchStatus.assertBatchIsProcessing(batch);
  console.log('Assereted the batch is done...')
  // Update batch with totals/bill run ID from charge module
  const isSuccess = await cmRefreshService.updateBatch(batchId);
  console.log('Updated the batch...')

  if (!isSuccess) {
    throw new StateError(`CM bill run summary not ready for batch ${batchId}`);
  }
  return isSuccess;
};

const onFailedHandler = async (job, err) => {
  const { batchId } = job.data;

  // On final attempt, error the batch and log
  if (helpers.isFinalAttempt(job)) {
    try {
      logger.error(`CM bill run summary not generated after ${job.attemptsMade} attempts, marking batch as errored ${batchId}`);
      await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary);
    } catch (error) {
      logger.error(`Unable to set batch status ${batchId}`, error);
    }
  } else if (err.name === 'StateError') {
    // Only logger an info message if we the CM has not generated bill run summary - this is expected
    // behaviour
    logger.info(err.message);
  } else {
    // Do normal error logging
    helpers.onFailedHandler(job, err);
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.hasScheduler = true;
exports.onFailed = onFailedHandler;
exports.workerOptions = {
  maxStalledCount: 3,
  stalledInterval: 60000,
  lockDuration: 3600000,
  lockRenewTime: 3600000 / 2
};
