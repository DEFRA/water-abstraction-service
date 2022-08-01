const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const uuid = require('uuid/v4')

const childProcess = require('child_process')

const processChargeVersionYearJob = require('../../../../src/modules/billing/jobs/process-charge-version-year')
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')
const batchService = require('../../../../src/modules/billing/services/batch-service')
const { logger } = require('../../../../src/logger')

const Batch = require('../../../../src/lib/models/batch')

const batchId = uuid()
const billingBatchChargeVersionYearId = uuid()

experiment('modules/billing/jobs/process-charge-version-year', () => {
  let batch

  beforeEach(async () => {
    batch = new Batch(batchId)
    batch.status = Batch.BATCH_STATUS.processing

    sandbox.stub(batchService, 'getBatchById').resolves(batch)
    sandbox.stub(childProcess, 'fork').resolves({
      on: sandbox.spy(),
      send: sandbox.spy()
    })
    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logOnComplete')
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus')
    sandbox.stub(batchJob, 'logOnCompleteError')

    sandbox.stub(logger, 'info')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = processChargeVersionYearJob.createMessage(batchId, billingBatchChargeVersionYearId)
    })

    test('creates the expected message array', async () => {
      const jobMessage = [
        'billing.process-charge-version-year',
        {
          batchId,
          billingBatchChargeVersionYearId
        },
        {
          jobId: `billing.process-charge-version-year.${batchId}.${billingBatchChargeVersionYearId}`
        }
      ]
      expect(message).to.equal(jobMessage)
    })
  })

  experiment('.onComplete', () => {
    const job = {
      data: {
        billingBatchChargeVersionYearId
      }
    }
    beforeEach(async () => {
      await processChargeVersionYearJob.onComplete(job)
    })

    test('logger is called to record the job outcome', () => {
      expect(batchJob.logOnComplete.called).to.be.true()
    })
  })
})
