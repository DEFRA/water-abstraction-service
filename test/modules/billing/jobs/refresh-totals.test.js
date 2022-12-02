'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')
const sandbox = require('sinon').createSandbox()

const Batch = require('../../../../src/lib/models/batch')
const { BATCH_ERROR_CODE } = require('../../../../src/lib/models/batch')

// Things to stub
const batchService = require('../../../../src/modules/billing/services/batch-service')
const cmRefreshService = require('../../../../src/modules/billing/services/cm-refresh-service')
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs')
const billingBatchesRepo = require('../../../../src/lib/connectors/repos/billing-batches')
const billingTransactionsRepo = require('../../../../src/lib/connectors/repos/billing-transactions')
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')
const { logger } = require('../../../../src/logger')
const helpers = require('@envage/water-abstraction-helpers')

// Thing under test
const refreshTotals = require('../../../../src/modules/billing/jobs/refresh-totals')

const BATCH_ID = uuid()

experiment.only('modules/billing/jobs/refresh-totals', () => {
  let batch

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logHandlingError')
    sandbox.stub(batchJob, 'logOnComplete')
    sandbox.stub(batchJob, 'logOnCompleteError')

    sandbox.stub(billingBatchesRepo, 'update').resolves()
    sandbox.stub(billingTransactionsRepo, 'findByBatchId').resolves([{}, {}])

    sandbox.stub(cmRefreshService, 'updateBatch')
    sandbox.stub(chargeModuleBillRunConnector, 'getStatus').resolves({
      status: 'generated'
    })
    sandbox.stub(batchService, 'setErrorStatus')

    batch = new Batch().fromHash({
      id: BATCH_ID,
      status: Batch.BATCH_STATUS.processing
    })
    sandbox.stub(batchService, 'getBatchById').resolves(batch)

    sandbox.stub(logger, 'error')

    sandbox.stub(helpers.serviceRequest, 'get').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.jobName', () => {
    test('is set to the expected value', async () => {
      expect(refreshTotals.jobName).to.equal('billing.refresh-totals')
    })
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = refreshTotals.createMessage(BATCH_ID)
    })

    test('creates the expected message array', async () => {
      const [name, data, options] = message
      expect(name).to.equal('billing.refresh-totals')
      expect(data).to.equal({ batchId: BATCH_ID })

      expect(options.jobId).to.startWith(`billing.refresh-totals.${BATCH_ID}.`)
      expect(options.attempts).to.equal(10)
      expect(options.backoff).to.equal({
        type: 'exponential',
        delay: 5000
      })
    })
  })

  const defaultJob = {
    data: {
      batchId: BATCH_ID
    },
    returnvalue: {
      batch: {
        batchType: 'BATCH_TYPE',
        scheme: 'SCHEME'
      }
    }
  }

  experiment('.handler', () => {
    experiment('when there are no errors', () => {
      beforeEach(async () => {
        cmRefreshService.updateBatch.resolves(true)
        await refreshTotals.handler(defaultJob)
      })

      test('logs an info message', async () => {
        expect(batchJob.logHandling.calledWith(defaultJob)).to.be.true()
      })

      test('refreshes the totals from the charge module using the batch ID', async () => {
        expect(cmRefreshService.updateBatch.calledWith(BATCH_ID))
      })

      test('no error is logged', async () => {
        expect(batchJob.logHandlingError.called).to.be.false()
      })
    })

    experiment('when the batch is not "processing"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.error
        await expect(refreshTotals.handler(defaultJob)).to.reject()
      })

      test('the error is not logged because logging is left to the onFailed handler', async () => {
        expect(batchJob.logHandlingError.called).to.be.false()
      })
    })

    experiment('when there are errors', () => {
      let error

      beforeEach(async () => {
        error = new Error('refresh error')
        cmRefreshService.updateBatch.rejects(error)
        await expect(refreshTotals.handler(defaultJob)).to.reject()
      })

      test('the error is not logged because logging is left to the onFailed handler', async () => {
        expect(batchJob.logHandlingError.called).to.be.false()
      })
    })
  })

  experiment('.onFailedHandler', () => {
    let job
    const err = new Error('oops')

    experiment('when the attempt to get the bill run summary from CM is not the final one', () => {
      beforeEach(async () => {
        job = {
          ...defaultJob,
          attemptsMade: 5,
          opts: {
            attempts: 10
          }
        }
        await refreshTotals.onFailed(job, err)
      })

      test('the batch is not updated', async () => {
        expect(batchService.setErrorStatus.called).to.be.false()
      })
    })

    experiment('on the final attempt to get the bill run summary from CM', () => {
      beforeEach(async () => {
        job = {
          ...defaultJob,
          attemptsMade: 10,
          opts: {
            attempts: 10
          }
        }
        await refreshTotals.onFailed(job, err)
      })

      test('the batch is not updated', async () => {
        expect(batchService.setErrorStatus.calledWith(
          BATCH_ID, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary
        )).to.be.true()
      })
    })
  })

  experiment('.onComplete', () => {
    let job

    beforeEach(() => {
      job = {
        ...defaultJob
      }
    })

    experiment('when batchType is `supplementary` and scheme is `alcs`', () => {
      beforeEach(() => {
        job.returnvalue.batch.batchType = 'supplementary'
        job.returnvalue.batch.scheme = 'alcs'

        refreshTotals.onComplete(job)
      })

      test('makes a service request', async () => {
        const result = helpers.serviceRequest.get.calledOnce

        expect(result).to.be.true()
      })
    })

    experiment('when batchType is not `supplementary` and scheme is not `alcs`', () => {
      beforeEach(() => {
        job.returnvalue.batch.batchType = 'two_part_tariff'
        job.returnvalue.batch.scheme = 'sroc'

        refreshTotals.onComplete(job)
      })

      test('does not make a service request', async () => {
        const result = helpers.serviceRequest.get.calledOnce

        expect(result).to.be.false()
      })
    })
  })
})
