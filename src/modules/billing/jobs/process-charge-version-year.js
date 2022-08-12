'use strict'

const { get } = require('lodash')

const JOB_NAME = 'billing.process-charge-version-year'
const { logger } = require('../../../logger')
const { jobName: prepareTransactionsJobName } = require('./prepare-transactions')

const messageQueue = require('../../../lib/message-queue-v2')

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch')
const batchJob = require('./lib/batch-job')
const chargeVersionYearService = require('../services/charge-version-year')

const config = require('../../../../config')
const helpers = require('./lib/helpers')

const fork = require('child_process').fork

let child
if (process.env.name === 'service-background') {
  child = fork('./src/modules/billing/jobs/lib/process-charge-version-year-worker.js')
}

const createMessage = (batchId, billingBatchChargeVersionYearId) => ([
  JOB_NAME,
  {
    batchId,
    billingBatchChargeVersionYearId
  },
  {
    jobId: `${JOB_NAME}.${batchId}.${billingBatchChargeVersionYearId}`
  }
])

const handler = async job => {
  batchJob.logHandling(job)
  const chargeVersionYearId = get(job, 'data.billingBatchChargeVersionYearId')
  try {
    return new Promise((resolve, reject) => {
      child.on('message', msg => {
        if (msg.complete === true && msg.batchId) {
          messageQueue.getQueueManager().add(prepareTransactionsJobName, msg.batchId)
        } else if (msg.error) {
          logger.error(msg.error)
          reject(msg.error)
        } else if (msg.jobComplete === true) {
          resolve()
        } else {
          logger.info('Process-charge-version-year child process: ', msg)
        }
      })

      child.send(chargeVersionYearId)
    })
  } catch (err) {
    await chargeVersionYearService.setErrorStatus(chargeVersionYearId)
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToProcessChargeVersions)
    throw err
  }
}

const onComplete = async job => batchJob.logOnComplete(job)

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.onFailed = helpers.onFailedHandler
exports.onComplete = onComplete
exports.workerOptions = {
  concurrency: config.billing.processChargeVersionYearsJobConcurrency,
  lockDuration: 3600000,
  lockRenewTime: 3600000 / 2
}
