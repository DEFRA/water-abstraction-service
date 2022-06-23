'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const { logger } = require('../../../../src/logger')
const populateBatchChargeVersionsJob = require('../../../../src/modules/billing/jobs/populate-batch-charge-versions')
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')

const batchService = require('../../../../src/modules/billing/services/batch-service')
const chargeVersionService = require('../../../../src/modules/billing/services/charge-version-service')

const Batch = require('../../../../src/lib/models/batch')
const Region = require('../../../../src/lib/models/region')

const uuid = require('uuid/v4')

const batchId = uuid()

const createBatch = () => {
  const batch = new Batch(batchId)
  batch.region = new Region(uuid())
  return batch
}

const createBillingBatchChargeVersionYears = batch => [
  {
    billingBatchChargeVersionYearId: uuid(),
    billingBatchId: batch.id,
    chargeVersionId: uuid(),
    financialYearEnding: 2021
  },
  {
    billingBatchChargeVersionYearId: uuid(),
    billingBatchId: batch.id,
    chargeVersionId: uuid(),
    financialYearEnding: 2021
  }
]

experiment('modules/billing/jobs/populate-batch-charge-versions', () => {
  let batch, billingBatchChargeVersionYears, queueManager

  beforeEach(async () => {
    sandbox.stub(logger, 'info')

    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus')
    sandbox.stub(batchJob, 'logOnCompleteError')

    batch = createBatch()
    billingBatchChargeVersionYears = createBillingBatchChargeVersionYears(batch)

    sandbox.stub(batchService, 'getBatchById').resolves(batch)
    sandbox.stub(batchService, 'setErrorStatus')

    sandbox.stub(chargeVersionService, 'createForBatch').resolves(billingBatchChargeVersionYears)

    queueManager = {
      add: sandbox.stub()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(populateBatchChargeVersionsJob.jobName).to.equal('billing.populate-batch-charge-versions')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = populateBatchChargeVersionsJob.createMessage(batchId)
      expect(message).to.equal([
        'billing.populate-batch-charge-versions',
        {
          batchId
        },
        {
          jobId: `billing.populate-batch-charge-versions.${batchId}`
        }
      ])
    })
  })

  experiment('.handler', () => {
    let result, job

    beforeEach(async () => {
      job = {
        data: {
          batchId
        }
      }
    })

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        result = await populateBatchChargeVersionsJob.handler(job)
      })

      test('fetches the correct batch from the batch service', async () => {
        expect(batchService.getBatchById.calledWith(
          batch.id
        )).to.be.true()
      })

      test('includes the batch in the job response', async () => {
        expect(result.batch).to.equal(batch)
      })

      test('includes the updated batch in the job response', async () => {
        expect(result.batch).to.be.an.object()
      })
    })

    experiment('when there is an error', () => {
      const error = new Error('oops!')
      let err

      beforeEach(async () => {
        batchService.getBatchById.rejects(error)
        const func = () => populateBatchChargeVersionsJob.handler(job)
        err = await expect(func()).to.reject()
      })

      test('the error is logged and batch marked as error status', async () => {
        const { args } = batchJob.logHandlingErrorAndSetBatchStatus.lastCall
        expect(args[0]).to.equal(job)
        expect(args[1] instanceof Error).to.be.true()
        expect(args[2]).to.equal(Batch.BATCH_ERROR_CODE.failedToPopulateChargeVersions)
      })

      test('re-throws the error', async () => {
        expect(error).to.equal(err)
      })
    })
  })

  experiment('.onComplete', () => {
    experiment('when the batch is a processing "annual" batch', () => {
      let job

      beforeEach(async () => {
        job = {
          returnvalue: {
            batch: {
              status: Batch.BATCH_STATUS.processing,
              type: Batch.BATCH_TYPE.annual
            }
          }
        }
        await populateBatchChargeVersionsJob.onComplete(job, queueManager)
      })

      test('the process charge versions job is added to the queue', async () => {
        expect(queueManager.add.callCount).to.equal(1)
        expect(queueManager.add.calledWith(
          'billing.process-charge-versions', job.returnvalue.batch.id
        )).to.be.true()
      })
    })

    experiment('when the batch is a processing "two-part tariff" batch', () => {
      let job

      beforeEach(async () => {
        job = {
          returnvalue: {
            batch: {
              status: Batch.BATCH_STATUS.processing,
              type: Batch.BATCH_TYPE.twoPartTariff
            }
          }
        }
        await populateBatchChargeVersionsJob.onComplete(job, queueManager)
      })

      test('the two-part tariff matching job is added to the queue', async () => {
        expect(queueManager.add.callCount).to.equal(1)
        expect(queueManager.add.calledWith(
          'billing.two-part-tariff-matching', job.returnvalue.batch.id
        )).to.be.true()
      })
    })

    experiment('when the batch is a processing "supplementary" batch', () => {
      let job

      beforeEach(async () => {
        job = {
          returnvalue: {
            batch: {
              status: Batch.BATCH_STATUS.processing,
              type: Batch.BATCH_TYPE.supplementary
            }
          }
        }
        await populateBatchChargeVersionsJob.onComplete(job, queueManager)
      })

      test('the two-part tariff matching job is added to the queue', async () => {
        expect(queueManager.add.callCount).to.equal(1)
        expect(queueManager.add.calledWith(
          'billing.two-part-tariff-matching', job.returnvalue.batch.id
        )).to.be.true()
      })
    })

    experiment('when there is an error', () => {
      let job, err

      beforeEach(async () => {
        err = new Error('oops')
        queueManager.add.rejects(err)
        job = {
          returnvalue: {
            batch: {
              status: Batch.BATCH_STATUS.processing,
              type: Batch.BATCH_TYPE.twoPartTariff
            }
          }
        }
        await populateBatchChargeVersionsJob.onComplete(job, queueManager)
      })

      test('a message is logged', async () => {
        expect(batchJob.logOnCompleteError.calledWith(job, err)).to.be.true()
      })
    })
  })
})
