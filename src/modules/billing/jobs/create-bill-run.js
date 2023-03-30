'use strict'

const JOB_NAME = 'billing.create-bill-run'

const batchService = require('../services/batch-service')
const { BATCH_ERROR_CODE, BATCH_STATUS, BATCH_TYPE } = require('../../../lib/models/batch')
const batchJob = require('./lib/batch-job')
const helpers = require('./lib/helpers')

const { jobName: populateBatchChargeVersionJobName } = require('./populate-batch-charge-versions')
const { jobName: rebillingJobName } = require('./rebilling')

const createMessage = helpers.createMessage.bind(null, JOB_NAME)

const getNextJobName = batchType => batchType === BATCH_TYPE.supplementary
  ? rebillingJobName
  : populateBatchChargeVersionJobName

const handler = async job => {
  batchJob.logHandling(job)
  const batchId = job.data.batchId

  try {
    await batchService.setStatus(batchId, BATCH_STATUS.processing)
    const batch = await batchService.createChargeModuleBillRun(batchId)
    return { type: batch.type }
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToCreateBillRun)
    throw err
  }
}

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job)
  try {
    // Publish next job in process
    const batchId = job.data.batchId
    const nextJobName = getNextJobName(job.returnvalue.type)
    await queueManager.add(nextJobName, batchId)
  } catch (err) {
    batchJob.logOnCompleteError(job)
  }
}

exports.handler = handler
exports.onComplete = onComplete
exports.onFailed = helpers.onFailedHandler
exports.jobName = JOB_NAME
exports.createMessage = createMessage
