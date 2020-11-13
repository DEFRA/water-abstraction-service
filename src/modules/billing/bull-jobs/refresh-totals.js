'use strict';

const { get } = require('lodash');

const { ioredis: connection } = require('../../../lib/connectors/io-redis');

// Bull queue setup
const { Queue, Worker } = require('bullmq');
const JOB_NAME = 'billing.refresh-totals';
const queue = new Queue(JOB_NAME, { connection });

const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');

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
    await batchService.refreshTotals(batchId);
  } catch (err) {
    batchJob.logHandlingError(job, err);
    throw err;
  }

  return {
    batch: job.data.batch
  };
};

const worker = new Worker(JOB_NAME, handler, { connection });
worker.on('error', helpers.onErrorHandler);

exports.createMessage = createMessage;
exports.queue = queue;
exports.worker = worker;
