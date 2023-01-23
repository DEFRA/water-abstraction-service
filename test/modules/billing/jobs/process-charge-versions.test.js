const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { v4: uuid } = require('uuid')

const processChargeVersionsJob = require('../../../../src/modules/billing/jobs/process-charge-versions')
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year')
const batchService = require('../../../../src/modules/billing/services/batch-service')
const { logger } = require('../../../../src/logger')

const Batch = require('../../../../src/lib/models/batch')

const batchId = uuid()
const eventId = 'test-event-id'

const billingBatchChargeVersionYears = [{
  billingBatchChargeVersionYearId: 'test-charge-version-year-1'
}, {
  billingBatchChargeVersionYearId: 'test-charge-version-year-2'
}]

experiment('modules/billing/jobs/process-charge-versions', () => {
  let batch, queueManager

  beforeEach(async () => {
    batch = new Batch(batchId)
    batch.status = Batch.BATCH_STATUS.processing

    sandbox.stub(batchService, 'getBatchById').resolves(batch)
    sandbox.stub(batchService, 'setErrorStatus')
    sandbox.stub(batchService, 'requestCMBatchGeneration')

    sandbox.stub(chargeVersionYearService, 'getForBatch').resolves(billingBatchChargeVersionYears)

    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus')
    sandbox.stub(batchJob, 'logOnCompleteError')

    sandbox.stub(logger, 'info')

    queueManager = {
      add: sandbox.stub()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = processChargeVersionsJob.createMessage(batchId)
    })

    test('creates the expected message array', async () => {
      expect(message).to.equal([
        'billing.process-charge-versions',
        {
          batchId
        },
        {
          jobId: `billing.process-charge-versions.${batchId}`
        }
      ])
    })
  })

  experiment('.handler', () => {
    let result, message

    experiment('when the batch status is "processing"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.processing
        message = {
          data: {
            batchId
          }
        }
        result = await processChargeVersionsJob.handler(message)
      })

      test('the batch is loaded', async () => {
        expect(batchService.getBatchById.calledWith(batchId)).to.be.true()
      })

      test('the charge version years are loaded for the batch', async () => {
        expect(chargeVersionYearService.getForBatch.calledWith(
          batchId
        )).to.be.true()
      })

      test('the handler returns the billingBatchChargeVersionYear IDs', async () => {
        expect(result.billingBatchChargeVersionYearIds).to.equal([
          billingBatchChargeVersionYears[0].billingBatchChargeVersionYearId,
          billingBatchChargeVersionYears[1].billingBatchChargeVersionYearId
        ])
      })
    })

    experiment('when the batch status is not "processing"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.ready
        message = {
          data: {
            eventId,
            batch
          }
        }
      })

      test('an error is logged and rethrown', async () => {
        const func = () => processChargeVersionsJob.handler(message)
        const err = await expect(func()).to.reject()
        expect(err.message).to.equal(`Expected queued,processing,sending batch status, but got ${Batch.BATCH_STATUS.ready}`)
        expect(batchJob.logHandlingErrorAndSetBatchStatus.calledWith(message, err, Batch.BATCH_ERROR_CODE.failedToProcessChargeVersions)).to.be.true()
      })
    })

    experiment('when there is an error', () => {
      const err = new Error('oops')
      let error

      beforeEach(async () => {
        batchService.getBatchById.rejects(err)
        const func = () => processChargeVersionsJob.handler(message)
        error = await expect(func()).to.reject()
      })

      test('the error is logged and batch marked as error status', async () => {
        const { args } = batchJob.logHandlingErrorAndSetBatchStatus.lastCall
        expect(args[0]).to.equal(message)
        expect(args[1] instanceof Error).to.be.true()
        expect(args[2]).to.equal(Batch.BATCH_ERROR_CODE.failedToProcessChargeVersions)
      })

      test('re-throws the error', async () => {
        expect(error).to.equal(err)
      })
    })
  })

  experiment('.onComplete', () => {
    let job
    beforeEach(async () => {
      job = {
        data: {
          batchId
        },
        returnvalue: {
          billingBatchChargeVersionYearIds: ['test-id-1', 'test-id-2']
        }
      }
    })

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        processChargeVersionsJob.onComplete(job, queueManager)
      })

      test('a job is published for each charge version year', async () => {
        expect(queueManager.add.callCount).to.equal(2)
        expect(queueManager.add.calledWith(
          'billing.process-charge-version-year', batchId, job.returnvalue.billingBatchChargeVersionYearIds[0]
        )).to.be.true()
        expect(queueManager.add.calledWith(
          'billing.process-charge-version-year', batchId, job.returnvalue.billingBatchChargeVersionYearIds[1]
        )).to.be.true()
      })
    })

    experiment('when there are 0 charge version years to process', () => {
      beforeEach(async () => {
        job.returnvalue.billingBatchChargeVersionYearIds = []
        processChargeVersionsJob.onComplete(job, queueManager)
      })

      test('charge module batch summary generation is requested', async () => {
        expect(batchService.requestCMBatchGeneration.calledWith(
          batchId
        )).to.be.true()
      })

      test('a job is published to refresh the totals', async () => {
        expect(queueManager.add.callCount).to.equal(1)
        expect(queueManager.add.calledWith(
          'billing.refresh-totals', batchId
        )).to.be.true()
      })
    })

    experiment('when there is an error', () => {
      let err

      beforeEach(async () => {
        err = new Error('oops')
        queueManager.add.rejects(err)
        await processChargeVersionsJob.onComplete(job, queueManager)
      })

      test('a message is logged', async () => {
        expect(batchJob.logOnCompleteError.calledWith(job, err)).to.be.true()
      })
    })
  })
})
