'use strict';

const { get } = require('lodash');

const JOB_NAME = 'billing.rebilling';

const { logger } = require('../../../logger');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const batchStatus = require('./lib/batch-status');
const { isEmpty } = require('lodash');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

// Services
const invoiceService = require('../../../lib/services/invoice-service');
const batchService = require('../services/batch-service');

const rebillingService = require('../services/rebilling-service');

const { jobName: populateBatchChargeVersionJobName } = require('./populate-batch-charge-versions');

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

const getBatchId = job => get(job, 'data.batchId');

const handler = async job => {
  batchJob.logHandling(job);

  // Get batch
  const batchId = getBatchId(job);
  const batch = await batchService.getBatchById(batchId);

  // Check batch in "processing" status
  batchStatus.assertBatchIsProcessing(batch);

  // Get invoices that are flagged for rebilling in the batch region
  const invoices = await invoiceService.getInvoicesFlaggedForRebilling(batch.region.id);

  // Process each invoice that needs rebilling
  for (const invoice of invoices) {
    await rebillingService.rebillInvoice(batch, invoice.id);
    const changes = {
      rebillingState: 'rebilled',
      originalBillingInvoiceId: isEmpty(invoice.originalBillingInvoiceId) ? invoice.id : invoice.originalBillingInvoiceId
    };
    await invoiceService.updateInvoice(invoice.id, changes);
  };
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);

  try {
    // Publish next job in process
    const batchId = getBatchId(job);
    await queueManager.add(populateBatchChargeVersionJobName, batchId);
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
  }
};

const onFailedHandler = async (job, err) => {
  const batchId = getBatchId(job);

  // On final attempt, error the batch and log
  if (helpers.isFinalAttempt(job)) {
    try {
      logger.error(`Rebilling failed ${batchId}`);
      await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToProcessRebilling);
    } catch (error) {
      logger.error(`Unable to set batch status ${batchId}`, error);
    }
  } else {
    // Do normal error logging
    helpers.onFailedHandler(job, err);
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = onFailedHandler;
exports.hasScheduler = true;
