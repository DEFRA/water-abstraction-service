'use strict'

const { v4: uuid } = require('uuid')

// Utils
const batchService = require('../services/batch-service.js')
const { logger } = require('../../../logger.js')
const UpdateInvoicesWorker = require('./lib/update-invoices-worker.js')

// Constants
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch.js')
const JOB_NAME = 'billing.update-invoice-references'

const createMessage = data => ([
  JOB_NAME,
  data,
  {
    jobId: `${JOB_NAME}.${data.batch.id}.${uuid()}`
  }
])

const handler = async job => {
  const { id: batchId } = job.data.batch

  try {
    await UpdateInvoicesWorker.updateInvoices(job)
    await batchService.setStatus(batchId, 'sent')
  } catch (error) {
    await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary)
  }
}

const onComplete = async (job) => {
  logger.info(`onComplete: ${job.id}`)
}

const onFailed = async (job, err) => {
  logger.error(`onFailed: ${job.id} - ${err.message}`, err.stack)
}

module.exports = {
  jobName: JOB_NAME,
  createMessage,
  handler,
  onFailed,
  onComplete,
  workerOptions: {
    lockDuration: 3600000,
    lockRenewTime: 3600000 / 2
  }
}
