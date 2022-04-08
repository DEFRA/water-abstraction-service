'use strict';

const { get, inRange } = require('lodash');

const JOB_NAME = 'billing.create-charge';

const batchService = require('../services/batch-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');
const transactionsService = require('../services/transactions-service');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');
const batchMapper = require('../mappers/batch');
const Transaction = require('../../../lib/models/transaction');
const { jobName: refreshTotalsJobName } = require('./refresh-totals');
const config = require('../../../../config');
const { logger } = require('../../../logger');

const workerOptions = {
  concurrency: config.billing.createChargeJobConcurrency
};

const createMessage = (batchId, billingBatchTransactionId) => ([
  JOB_NAME,
  {
    batchId,
    billingBatchTransactionId
  },
  {
    jobId: `${JOB_NAME}.${batchId}.${billingBatchTransactionId}`,
    attempts: 6,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
]);

const getStatus = err => get(err, 'statusCode', 0);

/**
 * Checks if the error is an HTTP client error (in range 400 - 499)
 * @param {Error} err
 * @return {Boolean}
 */
const isClientError = err => inRange(getStatus(err), 400, 500);

const updateBatchState = async batch => {
  const statuses = await batchService.getTransactionStatusCounts(batch.id);

  const isReady = get(statuses, Transaction.statuses.candidate, 0) === 0;

  if (isReady) {
    // Clean up batch
    await batchService.cleanup(batch.id);
  }

  return isReady;
};

const getTransactionStatus = batch => get(batch, 'invoices[0].invoiceLicences[0].transactions[0].status');

const handler = async job => {
  batchJob.logHandling(job);
  const transactionId = get(job, 'data.billingBatchTransactionId');

  // Create batch model from loaded data
  const batch = await transactionsService.getById(transactionId);

  try {
    // Skip CM call if transaction is already processed
    const status = getTransactionStatus(batch);
    if (status !== Transaction.statuses.candidate) {
      return await updateBatchState(batch);
    }

    // Map data to charge module transaction
    const [cmTransaction] = batchMapper.modelToChargeModule(batch);

    // Create transaction in Charge Module
    const response = await chargeModuleBillRunConnector.addTransaction(batch.externalId, cmTransaction);

    // Update/remove our local transaction in water.billing_transactions
    await transactionsService.updateWithChargeModuleResponse(transactionId, response);

    // Note: the await is needed to ensure any error is handled here
    return await updateBatchState(batch);
  } catch (err) {
    batchJob.logHandlingError(job, err);

    // if error code >= 400 and < 500 set transaction status to error and continue
    if (isClientError(err)) {
      await transactionsService.setErrorStatus(transactionId);
      return updateBatchState(batch);
    }
    // throw error to retry
    throw err;
  }
};

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job);

  try {
    const { batchId } = job.data;
    const isReady = job.returnvalue;

    if (isReady) {
      await batchService.requestCMBatchGeneration(batchId);
      await queueManager.add(refreshTotalsJobName, batchId);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
  }
};

const onFailedHandler = async (job, err) => {
  const batchId = get(job, 'data.batchId');
  const transactionId = get(job, 'data.billingBatchTransactionId');

  // On final attempt, error the batch and log
  if (helpers.isFinalAttempt(job)) {
    try {
      logger.error(`Transaction with id ${transactionId} not generated in CM after ${job.attemptsMade} attempts, marking batch as errored ${batchId}`);
      await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToCreateCharge);
    } catch (error) {
      logger.error(`Unable to set batch status ${batchId}`, error);
    }
  } else {
    // Do normal error logging
    helpers.onFailedHandler(job, err);
  }
};

exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = onFailedHandler;
exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.workerOptions = workerOptions;
exports.hasScheduler = true;


// const some = {
//   periodStart: "01-APR-2022",
//   periodEnd: "31-MAR-2023",
//   scheme: "sroc",
//   credit: false,
//   abatementFactor: "0.5",
//   actualVolume: 123,
//   aggregateFactor: 1,
//   areaCode: "KAEA",
//   authorisedDays: 214,
//   authrorisedVolume: 123,
//   batchNumber: "4ffaff0a-f34c-49ed-aa65-ec7553817847",
//   billableDays: 214,
//   chargeCategoryCode: "4.5.17",
//   chargeCategoryDescription: "Medium loss, non-tidal, restricted water, greater than 83 up to and including 142 ML/yr, Tier 1 model",
//   chargePeriod: "01-APR-2022 - 31-MAR-2023",
//   clientId: "97807dfa-a090-4483-a80a-15f6832ca41d",
//   compensationCharge: false,
//   customerReference: "S88899155A",
//   licenceNumber: "01/115",
//   lineDescription: "test category ref",
//   loss: "medium",
//   region: "S",
//   regionalChargingArea: "Southern",
//   section127Agreement: true,
//   section130Agreement: true,
//   supportedSource: true,
//   supportedSourceName: "Glen Groundwater",
//   twoPartTariff: true,
//   waterCompanyCharge: true,
//   waterUndertaker: true,
//   winterOnly: true,
// };