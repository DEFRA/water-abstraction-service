'use strict';

const { get } = require('lodash');

const JOB_NAME = 'billing.delete-errored-batch';

const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

const { logger } = require('../../../logger');

const createMessage = batchId => ([
  JOB_NAME,
  {
    batchId
  },
  {
    jobId: `${JOB_NAME}.${batchId}`,
    attempts: 6,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
]);

const handler = async job => {
  batchJob.logHandling(job);

  // Get batch
  const batchId = get(job, 'data.batchId');
  const batch = await batchService.getBatchById(batchId);

  // Delete batch in charge module
  await chargeModuleBillRunConnector.delete(batch.externalId);
};

const onFailedHandler = async (job, err) => {
  const batchId = get(job, 'data.batchId');

  // Log error on final attempt
  if (helpers.isFinalAttempt(job)) {
    logger.error(`Failed to delete charge module bill run for errored batch ${batchId} after ${job.attemptsMade} attempts`);
  } else {
    // Default failed job error logging
    helpers.onFailedHandler(job, err);
  }
};

exports.handler = handler;
exports.onFailed = onFailedHandler;
exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.hasScheduler = true;
