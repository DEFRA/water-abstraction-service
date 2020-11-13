'use strict';

const { partial, get } = require('lodash');

const { ioredis: connection } = require('../../../lib/connectors/io-redis');

// Bull queue setup
const { Queue, Worker } = require('bullmq');
const JOB_NAME = 'billing.populate-batch-charge-versions';
const queue = new Queue(JOB_NAME, { connection });

const batchService = require('../services/batch-service');
const chargeVersionService = require('../services/charge-version-service');

const { BATCH_ERROR_CODE, BATCH_STATUS, BATCH_TYPE } = require('../../../lib/models/batch');
const helpers = require('./lib/helpers');
const batchJob = require('./lib/batch-job');
const processChargeVersionsJob = require('./process-charge-versions');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const handler = async job => {
  batchJob.logHandling(job);
  const batchId = get(job, 'data.batchId');

  try {
    const batch = await batchService.getBatchById(batchId);

    // Populate water.billing_batch_charge_version_years
    const billingBatchChargeVersionYears = await chargeVersionService.createForBatch(batch);

    // If there is nothing to process, mark empty batch
    if (billingBatchChargeVersionYears.length === 0) {
      const updatedBatch = await batchService.setStatus(batchId, BATCH_STATUS.empty);
      return { batch: updatedBatch };
    }

    return { batch };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPopulateChargeVersions);
    throw err;
  }
};

const onComplete = async job => {
  batchJob.logOnComplete(job);

  try {
    const { batch } = job.returnvalue;

    // Don't do any further processing for empty batch
    if (batch.status === BATCH_STATUS.empty) {
      return;
    }

    if (batch.type === BATCH_TYPE.annual) {
      processChargeVersionsJob.queue.add(
        ...processChargeVersionsJob.createMessage(batch)
      );
    } else {
      // @TODO process two-part tariff matching
    }
  } catch (err) {
    batchJob.logOnCompleteError(job);
  }
};

const worker = new Worker(JOB_NAME, handler, { connection });
worker.on('completed', onComplete);
worker.on('error', helpers.onErrorHandler);

exports.createMessage = createMessage;
exports.queue = queue;
