'use strict';

const { get } = require('lodash');

const ioRedis = require('../../../lib/connectors/io-redis');
const connection = ioRedis.createConnection();

// Bull queue setup
const { Queue, Worker } = require('bullmq');
const JOB_NAME = 'billing.process-charge-version-year';
const queue = new Queue(JOB_NAME, { connection });

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const chargeVersionYearService = require('../services/charge-version-year');
const billingVolumeService = require('../services/billing-volumes-service');
const prepareTransactionsJob = require('./prepare-transactions');
const helpers = require('./lib/helpers');

const createMessage = (batch, billingBatchChargeVersionYear) => ([
  JOB_NAME,
  {
    batch,
    billingBatchChargeVersionYear
  },
  {
    jobId: `${JOB_NAME}.${batch.id}.${billingBatchChargeVersionYear.billingBatchChargeVersionYearId}`
  }
]);

const handler = async job => {
  batchJob.logHandling(job);

  const chargeVersionYearId = get(job, 'data.billingBatchChargeVersionYear.billingBatchChargeVersionYearId');

  try {
    // Load charge version year
    const chargeVersionYear = await chargeVersionYearService.getChargeVersionYearById(chargeVersionYearId);
    // Process charge version year
    const batch = await chargeVersionYearService.processChargeVersionYear(chargeVersionYear);

    // Persist data
    await batchService.saveInvoicesToDB(batch);

    // Update status in water.billing_batch_charge_version_year
    await chargeVersionYearService.setReadyStatus(chargeVersionYearId);

    // Check how many records left to process
    const { processing } = await chargeVersionYearService.getStatusCounts(batch.id);
    if (processing === 0) {
      // Check if batch requires TPT review
      const numberOfUnapprovedBillingVolumes = await billingVolumeService.getUnapprovedVolumesForBatchCount(batch);
      if (numberOfUnapprovedBillingVolumes > 0) {
        const updatedbatch = await batchService.setStatus(batch.id, BATCH_STATUS.review);
        return { processing, batch: updatedbatch };
      }
    }

    return {
      batch,
      processing
    };
  } catch (err) {
    await chargeVersionYearService.setErrorStatus(chargeVersionYearId);
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToProcessChargeVersions);
    throw err;
  }
};

const onComplete = async job => {
  batchJob.logOnComplete(job);

  try {
    const { batch, processing } = job.returnvalue;

    console.log(processing);

    // When all charge version years are processed, publish next job
    if (processing === 0 && (batch.status === BATCH_STATUS.processing)) {
      await prepareTransactionsJob.queue.add(
        ...prepareTransactionsJob.createMessage(batch)
      );
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

const worker = new Worker(JOB_NAME, handler, { connection });
worker.on('completed', onComplete);
worker.on('failed', helpers.onFailedHandler);

exports.createMessage = createMessage;
exports.queue = queue;
