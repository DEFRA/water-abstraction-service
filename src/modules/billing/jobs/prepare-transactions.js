'use strict'

const { get } = require('lodash')
const bluebird = require('bluebird')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const urlJoin = require('url-join')

const JOB_NAME = 'billing.prepare-transactions'

const batchService = require('../services/batch-service')
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch')
const batchJob = require('./lib/batch-job')
const helpers = require('./lib/helpers')
const { jobName: createChargeJobName } = require('./create-charge')
const { jobName: refreshTotalsJobName } = require('./refresh-totals')

const config = require('../../../../config')
const { logger } = require('../../../logger')
const supplementaryBillingService = require('../services/supplementary-billing-service')
const licenceService = require('../services/licences-service')

const billingBatchesRepo = require('../../../lib/connectors/repos/billing-batches')
const billingTransactionsRepo = require('../../../lib/connectors/repos/billing-transactions')

const Transaction = require('../../../lib/models/transaction')
const { BATCH_STATUS } = require('../../../lib/models/batch')

const createMessage = (batchId, batchType = null, scheme = null) => ([
  JOB_NAME,
  {
    batchId,
    batchType,
    scheme
  },
  {
    jobId: `${JOB_NAME}.${batchId}`
  }
])

const getTransactionId = transaction => transaction.billingTransactionId

const isCandidateTransaction = transaction => transaction.status === Transaction.statuses.candidate

const handler = async job => {
  batchJob.logHandling(job)

  const batchId = get(job, 'data.batchId')

  try {
    const batch = await batchService.getBatchById(batchId)

    // Supplementary processing handles credits/charges
    if (batch.isSupplementary()) {
      logger.info(`Processing supplementary transactions ${job.name}`)
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
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPrepareTransactions)
    throw err
  }
}

const onComplete = async (job, queueManager) => {
  try {
    const batchId = get(job, 'data.batchId')
    const { billingTransactionIds } = job.returnvalue

    // If there's nothing to process, skip to cm refresh
    if (billingTransactionIds.length === 0) {
      logger.info(`No transactions left to process for batch ${batchId}. Requesting CM batch generation...`)

      const numberOfTransactionsInBatch = await billingTransactionsRepo.findByBatchId(batchId)

      if (numberOfTransactionsInBatch.length === 0) {
        logger.info(`Batch ${batchId} is empty - WRLS will mark is as Empty, and will not ask the Charging module to generate it.`)
        await billingBatchesRepo.update(batchId, { status: BATCH_STATUS.empty })

        // Set "IncludeInSupplementaryBillingStatus" to 'no' for all licences in this batch
        await licenceService.updateIncludeInSupplementaryBillingStatusForEmptyBatch(batchId)

        // Initiate sroc supplementary billing if required
        if (job.data.batchType === 'supplementary' && job.data.scheme === 'alcs') {
          await _initiateSrocSupplementary()
        }
      } else {
        await batchService.requestCMBatchGeneration(batchId)
        await queueManager.add(refreshTotalsJobName, batchId)
      }
    } else {
      logger.info(`${billingTransactionIds.length} transactions produced for batch ${batchId} - creating charges`)
      await bluebird.mapSeries(
        billingTransactionIds,
        billingTransactionId => queueManager.add(createChargeJobName, batchId, billingTransactionId)
      )
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err)
  }
}

// TODO: Update this to hit correct endpoint
async function _initiateSrocSupplementary () {
  const requestUrl = urlJoin(config.services.system, 'status')
  await serviceRequest.get(requestUrl)
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
