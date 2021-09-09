'use strict';

const { get } = require('lodash');

const JOB_NAME = 'billing.approve-batch';

const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const { jobName: refreshTotalsJobName } = require('./refresh-totals');
const helpers = require('./lib/helpers');

const createMessage = (batchId, user) => ([
  JOB_NAME,
  {
    batchId,
    user
  },
  {
    jobId: `${JOB_NAME}.${batchId}`
  }
]);

const handler = async job => {
  batchJob.logHandling(job);

  const batchId = get(job, 'data.batchId');
  const user = get(job, 'data.user');

  const batch = await batchService.getBatchById(batchId);

  return batchService.approveBatch(batch, user);
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);

  try {
    const batchId = get(job, 'data.batchId');
    await queueManager.add(refreshTotalsJobName, batchId);
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
