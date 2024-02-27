'use strict'

// const fork = require('child_process').fork
const { v4: uuid } = require('uuid')

// Utils
const batchService = require('../services/batch-service.js')
const { logger } = require('../../../logger')
const UpdateInvoicesWorker = require('./lib/update-invoices-worker.js')

// Constants
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch')
const JOB_NAME = 'billing.update-invoices'

const createMessage = data => ([
  JOB_NAME,
  data,
  {
    jobId: `${JOB_NAME}.${data.batch.id}.${uuid()}`
  }
])

const handler = async job => {
  await UpdateInvoicesWorker.updateInvoices(job)
}

const onComplete = async (job) => {
  logger.info(`onComplete: ${job.id}`)
  await batchService.setStatus(job.data.batch.id, 'ready')
}

const onFailed = async (job, err) => {
  logger.error(`onFailed: ${job.id} - ${err.message}`, err.stack)
  await batchService.setErrorStatus(job.data.batch.id, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary)
}

module.exports = {
  jobName: JOB_NAME,
  createMessage,
  handler,
  onFailed,
  onComplete,
  workerOptions: {
    maxStalledCount: 3,
    stalledInterval: 120000,
    lockDuration: 120000,
    lockRenewTime: 120000 / 2
  }
}
