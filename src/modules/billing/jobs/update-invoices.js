'use strict'

const fork = require('child_process').fork
const uuid = require('uuid/v4')

// Utils
const batchJob = require('./lib/batch-job')
const helpers = require('./lib/helpers')
const { logger } = require('../../../logger')

// Constants
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch')
const JOB_NAME = 'billing.update-invoices'

let child
if (process.env.name === 'service-background') {
  child = fork('./src/modules/billing/jobs/lib/update-invoices-worker.js')
}

const createMessage = data => ([
  JOB_NAME,
  data,
  {
    jobId: `${JOB_NAME}.${data.batch.id}.${uuid()}`,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
])

const handler = async job => {
  try {
    // Create the worker.
    child.on('message', msg => {
      if (msg.error) {
        logger.error(msg.error)
      } else {
        logger.info('Update-invoices child process: ', msg)
      }
    })
    return child.send(job.data)
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary)
    throw err
  }
}

const onComplete = async job => batchJob.logOnComplete(job)

module.exports = {
  jobName: JOB_NAME,
  createMessage,
  handler,
  onFailed: helpers.onFailedHandler,
  onComplete,
  workerOptions: {
    maxStalledCount: 3,
    stalledInterval: 120000,
    lockDuration: 120000,
    lockRenewTime: 120000 / 2
  }
}
