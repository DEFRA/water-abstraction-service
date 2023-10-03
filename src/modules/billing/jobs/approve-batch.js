'use strict'

const JOB_NAME = 'billing.approve-batch'

const batchService = require('../services/batch-service')
const batchJob = require('./lib/batch-job')
const { jobName: refreshTotalsJobName } = require('./refresh-totals')
const helpers = require('./lib/helpers')

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

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.onComplete = onComplete
exports.onFailed = helpers.onFailedHandler
