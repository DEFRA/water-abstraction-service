'use strict';

const { get, partial } = require('lodash');

const ioRedis = require('../../../lib/connectors/io-redis');
const connection = ioRedis.createConnection();

// Bull queue setup
const { Queue, Worker } = require('bullmq');
const JOB_NAME = 'billing.create-bill-run';
const queue = new Queue(JOB_NAME, { connection });

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const populateBatchChargeVersionJob = require('./populate-batch-charge-versions');

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

const onComplete = async job => {
  batchJob.logOnComplete(job);
  try {
    // Publish next job in process
    const batchId = get(job, 'data.batchId');
    await populateBatchChargeVersionJob.queue.add(
      ...populateBatchChargeVersionJob.createMessage(batchId)
    );
  } catch (err) {
    batchJob.logOnCompleteError(job);
  }
};

const worker = new Worker(JOB_NAME, handler, { connection });
worker.on('completed', onComplete);
worker.on('failed', helpers.onFailedHandler);

exports.createMessage = createMessage;
exports.queue = queue;
