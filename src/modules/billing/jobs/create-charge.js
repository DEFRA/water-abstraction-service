'use strict'

const JOB_NAME = 'billing.create-charge'

const batchService = require('../services/batch-service')
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch')
const batchJob = require('./lib/batch-job')
const transactionsService = require('../services/transactions-service')
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs')
const batchMapper = require('../mappers/batch')
const Transaction = require('../../../lib/models/transaction')
const { jobName: refreshTotalsJobName } = require('./refresh-totals')
const config = require('../../../../config')

const workerOptions = {
  concurrency: config.billing.createChargeJobConcurrency
}

const createMessage = (batchId, billingBatchTransactionId) => ([
  JOB_NAME,
  {
    batchId,
    billingBatchTransactionId
  },
  {
    jobId: `${JOB_NAME}.${batchId}.${billingBatchTransactionId}`
  }
])

const updateBatchState = async batchId => {
  const statuses = await batchService.getTransactionStatusCounts(batchId)

  const candidate = statuses[Transaction.statuses.candidate] ?? 0
  const isReady = candidate === 0

  if (isReady) {
    // Clean up batch
    await batchService.cleanup(batchId)
  }

  return isReady
}

const getTransactionStatus = batch => batch.invoices?.[0].invoiceLicences[0].transactions[0].status

const handler = async job => {
  batchJob.logHandling(job)
  const transactionId = job.data.billingBatchTransactionId
  const batchId = job.data.batchId

  // Create batch model from loaded data
  // the batch contains all lower level related objects for pre-sroc
  // but for sroc we don't map all the related objects that is not needed
  // where it will slow down performance and the batch variable is then mainly transaction data
  const batch = await transactionsService.getById(transactionId)

  try {
    // Skip CM call if transaction is already processed
    const status = getTransactionStatus(batch) || batch.status
    if (status !== Transaction.statuses.candidate) {
      return await updateBatchState(batchId)
    }

    // Map data to charge module transaction
    const [cmTransaction] = batchMapper.modelToChargeModule(batch)

    // Create transaction in Charge Module
    const cmBatchId = batch.externalId || batch.billingInvoiceLicence.billingInvoice.billingBatch.externalId
    const response = await chargeModuleBillRunConnector.addTransaction(cmBatchId, cmTransaction)

    // Update/remove our local transaction in water.billing_transactions
    await transactionsService.updateWithChargeModuleResponse(transactionId, response)

    // Note: the await is needed to ensure any error is handled here
    return await updateBatchState(batchId)
  } catch (err) {
    batchJob.logHandlingError(job, err)

    await transactionsService.setErrorStatus(transactionId)

    // The exceptions thrown in a processor must be an Error object for BullMQ to work correctly.
    // The onFailedHandler will only be called if we throw an Error
    throw err
  }
}

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job)

  try {
    const { batchId } = job.data
    const isReady = job.returnvalue

    if (isReady) {
      await batchService.requestCMBatchGeneration(batchId)
      await queueManager.add(refreshTotalsJobName, batchId)
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err)
  }
}

const onFailedHandler = async (job, err) => {
  batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToCreateCharge)
}

exports.handler = handler
exports.onComplete = onComplete
exports.onFailed = onFailedHandler
exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.workerOptions = workerOptions
exports.hasScheduler = true
