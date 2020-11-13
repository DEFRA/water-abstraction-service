'use strict';

const { get, partial } = require('lodash');

const { ioredis: connection } = require('../../../lib/connectors/io-redis');

// Bull queue setup
const { Queue, Worker } = require('bullmq');
const JOB_NAME = 'billing.process-charge-versions';
const queue = new Queue(JOB_NAME, { connection });

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const processChargeVersionYearJob = require('./process-charge-version-year');
const batchStatus = require('./lib/batch-status');
const chargeVersionYearService = require('../services/charge-version-year');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const handler = async job => {
  batchJob.logHandling(job);

  const batchId = get(job, 'data.batchId');

  try {
    // Load batch
    const batch = await batchService.getBatchById(batchId);

    // Check batch in "processing" status
    batchStatus.assertBatchIsProcessing(batch);

    // Get all charge version years for processing
    const billingBatchChargeVersionYears = await chargeVersionYearService.getForBatch(batch.id);

    return {
      batch,
      billingBatchChargeVersionYears
    };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToProcessChargeVersions);
    throw err;
  }
};

const onComplete = async job => {
  batchJob.logOnComplete(job);

  try {
    const { batch, billingBatchChargeVersionYears } = job.returnvalue;

    // Publish a job to process each charge version year
    for (const billingBatchChargeVersionYear of billingBatchChargeVersionYears) {
      await processChargeVersionYearJob.queue.add(
        ...processChargeVersionYearJob.createMessage(batch, billingBatchChargeVersionYear)
      );
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

const worker = new Worker(JOB_NAME, handler, { connection });
worker.on('completed', onComplete);
worker.on('error', helpers.onErrorHandler);

exports.createMessage = createMessage;
exports.queue = queue;
