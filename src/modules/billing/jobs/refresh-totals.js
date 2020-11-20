'use strict';

const { get } = require('lodash');
const uuid = require('uuid/v4');

const JOB_NAME = 'billing.refresh-totals';

const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const { logger } = require('../../../logger');

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

  const batchId = get(job, 'data.batchId');

  // Update batch with totals/bill run ID from charge module
  const isSuccess = await batchService.refreshTotals(batchId);

  if (!isSuccess) {
    throw new StateError(`CM bill run summary not ready for batch ${batchId}`);
  }
};

const onFailedHandler = async (job, err) => {
  const { batchId } = job.data;

  if (helpers.isFinalAttempt(job)) {
    try {
      await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary);
    } catch (error) {
      logger.error(`Unable to set batch status ${batchId}`, error);
    }
  } else if (err.name === 'StateError') {
    return logger.info(err.message);
  }

  // Do normal logging
  helpers.onFailedHandler(job, err);
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.hasScheduler = true;
exports.onFailed = onFailedHandler;
