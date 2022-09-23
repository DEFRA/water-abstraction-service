'use strict'

const { get, partial } = require('lodash')

const JOB_NAME = 'billing.two-part-tariff-matching'

const batchService = require('../services/batch-service')
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch')
const batchJob = require('./lib/batch-job')
const helpers = require('./lib/helpers')
const batchStatus = require('./lib/batch-status')
const billingVolumeService = require('../services/billing-volumes-service')
const twoPartTariffService = require('../services/two-part-tariff')
const { jobName: processChargeVersionsJobName } = require('./process-charge-versions')
const TwoPartTariffMatchingService = require('../../../services/two-part-tariff-matching.service')

const createMessage = partial(helpers.createMessage, JOB_NAME)

const handler = async job => {
  batchJob.logHandling(job)

  const batchId = get(job, 'data.batchId')

  try {
    // Get batch
    const batch = await batchService.getBatchById(batchId)

    // Check batch in "processing" status
    batchStatus.assertBatchIsProcessing(batch)

    // Do TPT returns matching and populate water.billing_volumes
    await twoPartTariffService.processBatch(batch)
    // await TwoPartTariffMatchingService.go(batch)

    // Check if there are any TPT billing volumes for review
    // If there are, we go to the TPT review stage
    const unapprovedBillingVolumeCount = await billingVolumeService.getUnapprovedVolumesForBatchCount(batch)
    const isReviewNeeded = unapprovedBillingVolumeCount > 0
    if (isReviewNeeded) {
      await batchService.setStatusToReview(batch.id)
    }
    return { isReviewNeeded }
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToProcessTwoPartTariff)
    throw err
  }
}

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job)

  try {
    const { batchId } = job.data
    const { isReviewNeeded } = job.returnvalue

    // If no review needed, proceed to process the charge version years
    if (!isReviewNeeded) {
      await queueManager.add(processChargeVersionsJobName, batchId)
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
