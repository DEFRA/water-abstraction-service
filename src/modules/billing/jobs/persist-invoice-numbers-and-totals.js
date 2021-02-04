'use strict';

const { get } = require('lodash');
const uuid = require('uuid/v4');

const JOB_NAME = 'billing.persist-invoice-numbers-and-totals';

const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');

const { logger } = require('../../../logger');

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

  try {
    const batch = await batchService.getBatchById(batchId, true);
    await batchService.persistInvoiceNumbersAndTotals(batch);
  } catch (err) {
    await batchJob.logHandlingError(job, err);
    throw err;
  }
};

const onComplete = async job => {
  batchJob.logOnComplete(job);
};

const onFailed = async (job, err) => {
  const { batchId } = job.data;

  // On final attempt, log error
  if (helpers.isFinalAttempt(job)) {
    logger.error(`CM transactions for batch ${batchId} not retrieved after ${job.attemptsMade} attempts`, err);
  } else {
    // Do normal error logging
    helpers.onFailedHandler(job, err);
  }
};

exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = onFailed;
exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.hasScheduler = true;
