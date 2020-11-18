'use strict';

const { get } = require('lodash');

const ioRedis = require('../../../lib/connectors/io-redis');
const connection = ioRedis.createConnection();

// Bull queue setup
const { Queue, Worker, QueueScheduler } = require('bullmq');
const JOB_NAME = 'billing.refresh-totals';
const queue = new Queue(JOB_NAME, { connection });

const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

const { StateError } = require('../../../lib/errors');

const createMessage = batchId => ([
  JOB_NAME,
  {
    batchId
  },
  {
    jobId: `${JOB_NAME}.${batchId}`,
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
    // Update batch with totals/bill run ID from charge module
    const isSuccess = await batchService.refreshTotals(batchId);

    if (!isSuccess) {
      throw new StateError(`Bill run summary not ready for batch ${batchId}`);
    }
  } catch (err) {
    batchJob.logHandlingError(job, err);
    throw err;
  }

  return {
    batch: job.data.batch
  };
};

const scheduler = new QueueScheduler(JOB_NAME, {
  connection: ioRedis.createConnection()
});

const worker = new Worker(JOB_NAME, handler, { connection });

worker.on('failed', async (job, err) => {
  const { batchId } = job.data;

  if (helpers.isFinalAttempt(job)) {
    await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary);
  }

  // Do normal logging
  helpers.onFailedHandler(job, err);
});

exports.createMessage = createMessage;
exports.queue = queue;
exports.worker = worker;
exports.scheduler = scheduler;
