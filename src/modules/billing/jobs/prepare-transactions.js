'use strict'

const JOB_NAME = 'billing.prepare-transactions'

const batchService = require('../services/batch-service')
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch')
const batchJob = require('./lib/batch-job')
const helpers = require('./lib/helpers')
const { jobName: createChargeJobName } = require('./create-charge')
const { jobName: refreshTotalsJobName } = require('./refresh-totals')

const config = require('../../../../config')
const supplementaryBillingService = require('../services/supplementary-billing-service')
const licenceService = require('../services/licences-service')

const billingBatchesRepo = require('../../../lib/connectors/repos/billing-batches')
const billingTransactionsRepo = require('../../../lib/connectors/repos/billing-transactions')

const Transaction = require('../../../lib/models/transaction')
const { BATCH_STATUS } = require('../../../lib/models/batch')

const createMessage = (data) => helpers.createMessage.call(null, JOB_NAME, data)

const getTransactionId = transaction => transaction.billingTransactionId

const isCandidateTransaction = transaction => transaction.status === Transaction.statuses.candidate

const handler = async job => {
  batchJob.logHandling(job)

  const batchId = job.data.batchId

  try {
    const batch = await batchService.getBatchById(batchId)

    // Supplementary processing handles credits/charges
    if (batch.isSupplementary()) {
      batchJob.logInfo(job, 'Processing supplementary transactions')
      await supplementaryBillingService.processBatch(batch.id)
    }

    // Get all candidate transactions now in batch
    const transactions = await billingTransactionsRepo.findByBatchId(batch.id)
    const billingTransactionIds = transactions
      .filter(isCandidateTransaction)
      .map(getTransactionId)

    return {
      billingTransactionIds
    }
  } catch (err) {
    batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPrepareTransactions)
    throw err
  }
}

const onComplete = async (job, queueManager) => {
  try {
    const batchId = job.data.batchId
    const { billingTransactionIds } = job.returnvalue

    // If there's nothing to process, skip to cm refresh
    if (billingTransactionIds.length === 0) {
      batchJob.logInfo(job, `No transactions left to process for batch ${batchId}. Requesting CM batch generation...`)

      const numberOfTransactionsInBatch = await billingTransactionsRepo.findByBatchId(batchId)

      if (numberOfTransactionsInBatch.length === 0) {
        batchJob.logInfo(job, `Batch ${batchId} is empty - do not request Charging module generate.`)
        await billingBatchesRepo.update(batchId, { status: BATCH_STATUS.empty })
        // Set "IncludeInSupplementaryBillingStatus" to 'no' for all licences in this batch
        await licenceService.updateIncludeInSupplementaryBillingStatusForEmptyBatch(batchId)
      } else {
        batchJob.logInfo(job, `Batch ${batchId} not empty - requesting Charging module generate.`)
        await batchService.requestCMBatchGeneration(batchId)
        await queueManager.add(refreshTotalsJobName, batchId)
      }
    } else {
      batchJob.logInfo(
        job,
        `${billingTransactionIds.length} transactions produced for batch ${batchId} - creating charges`
      )
      for (let i = 0; i < billingTransactionIds.length; i++) {
        const lastOfUs = i + 1 === billingTransactionIds.length
        await queueManager.add(createChargeJobName, batchId, billingTransactionIds[i], lastOfUs)
      }
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err)
  }
}

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.onComplete = onComplete
exports.onFailed = helpers.onFailedHandler
exports.workerOptions = {
  concurrency: config.billing.prepareTransactionsJobConcurrency,
  lockDuration: 3600000,
  lockRenewTime: 3600000 / 2
}
