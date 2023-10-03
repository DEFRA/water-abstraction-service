'use strict'

const JOB_NAME = 'billing.approve-batch'

const batchService = require('../services/batch-service')
const batchJob = require('./lib/batch-job')
const { logger } = require('../../../logger')
const { jobName: refreshTotalsJobName } = require('./refresh-totals')

const createMessage = (batchId, user) => ([
// We set `removeOnComplete` to 500 to briefly retain completed bill run jobs, preventing duplicate bill runs,
// while `removeOnFail` is set to true to prevent bill runs from becoming stuck on the queue, allowing for re-runs.
  JOB_NAME,
  {
    batchId,
    user
  },
  {
    jobId: `${JOB_NAME}.${batchId}`,
    removeOnComplete: 500,
    removeOnFail: true
  }
])

const handler = async job => {
  batchJob.logHandling(job)

  const batchId = job.data.batchId
  const user = job.data.user

  const batch = await batchService.getBatchById(batchId)

  return batchService.approveBatch(batch, user)
}

const onComplete = async (job, queueManager) => {
  batchJob.logOnComplete(job)

  try {
    const batchId = job.data.batchId
    await queueManager.add(refreshTotalsJobName, batchId)
  } catch (err) {
    batchJob.logOnCompleteError(job, err)
  }
}

const onFailedHandler = async (job, err) => {
  // If a previous attempt to send the bill run has been tried but errored the logic in
  // src/modules/billing/services/batch-service.js approveBatch() will reset the status of the bill run back to READY.
  // We have found that subsequent attempts to send the bill run cause it to become 'stuck' This is because it seems
  // the failed job is left in the queue. As the job ID is based on the billing batch ID when we add further approve
  // jobs for this bill run BullMQ is ignoring them. It sees them as duplicates because they have the same key as a
  // job already in the queue.
  //
  // To allow further attempts to happen we call 'remove()' on the job if it fails. This will remove the
  // the job from the queue and allow a new job with the same ID to be processed.
  logger.error(`Job ${job.name} ${job.id} failed`, err.stack)
  await job.remove()
}

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.onComplete = onComplete
exports.onFailed = onFailedHandler
