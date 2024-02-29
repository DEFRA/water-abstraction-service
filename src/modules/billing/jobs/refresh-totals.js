'use strict'

const { v4: uuid } = require('uuid')

const JOB_NAME = 'billing.refresh-totals'

const batchService = require('../services/batch-service')
const batchJob = require('./lib/batch-job')
const helpers = require('./lib/helpers')
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch')
const { logger } = require('../../../logger')
const cmRefreshService = require('../services/cm-refresh-service')
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs')
const billingBatchesRepo = require('../../../lib/connectors/repos/billing-batches')
const billingTransactionsRepo = require('../../../lib/connectors/repos/billing-transactions')
const { BATCH_STATUS } = require('../../../lib/models/batch')

const { StateError } = require('../../../lib/errors')

const createMessage = batchId => ([
  JOB_NAME,
  {
    batchId
  },
  {
    jobId: `${JOB_NAME}.${batchId}.${uuid()}`
  }
])

const handler = async job => {
  batchJob.logHandling(job)

  const { batchId } = job.data

  // Load batch
  const batch = await batchService.getBatchById(batchId)
  const cmBatch = await chargeModuleBillRunConnector.getStatus(batch.externalId)

  // Check the batch isn't empty
  const numberOfTransactionsInBatch = await billingTransactionsRepo.findByBatchId(batchId)
  if (numberOfTransactionsInBatch.length === 0) {
    logger.info(
      `Batch ${batchId} is empty - WRLS will mark is as Empty, and will not ask the Charging module to generate it.`
    )
    await billingBatchesRepo.update(
      batchId,
      {
        status: BATCH_STATUS.empty,
        invoiceCount: null,
        creditNoteCount: null,
        netTotal: null,
        invoiceValue: null,
        creditNoteValue: null
      }
    )
  } else {
    // Check CM batch in "generated" or "billed" status
    // This indicates that our job is done and can move onto refreshing invoices
    if (!['generated', 'billed', 'billing_not_required'].includes(cmBatch.status)) {
      throw new StateError(`CM bill run summary not ready for batch ${batchId}`)
    }

    // Default to update the invoices and transactions after generating a bill run
    let nextJobName = 'billing.update-invoices'
    if (cmBatch.status !== 'generated') {
      // Else we need to update the invoices with their transactions references
      nextJobName = 'billing.update-invoice-references'
    }

    const isSuccess = await cmRefreshService.updateBatch(batchId, nextJobName)

    if (!isSuccess) {
      throw new StateError(`CM bill run summary not ready for batch ${batchId}`)
    }
  }
}

const onFailedHandler = async (job, err) => {
  const { batchId } = job.data

  // On final attempt, error the batch and log
  if (helpers.isFinalAttempt(job)) {
    try {
      logger.error(`CM bill run summary not generated after ${job.attemptsMade} attempts, marking batch as errored ${batchId}`)
      await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary)
    } catch (error) {
      logger.error(`Unable to set batch status ${batchId}`, error.stack)
    }
  } else if (err.name === 'StateError') {
    // Only logger an info message if we the CM has not generated bill run summary - this is expected
    // behaviour
    logger.info(err.message)
  } else {
    // Do normal error logging
    helpers.onFailedHandler(job, err)
  }
}

const onComplete = async job => batchJob.logOnComplete(job)

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.hasScheduler = true
exports.onFailed = onFailedHandler
exports.onComplete = onComplete
exports.workerOptions = {
  maxStalledCount: 3,
  stalledInterval: 60000,
  lockDuration: 3600000,
  lockRenewTime: 3600000 / 2
}
