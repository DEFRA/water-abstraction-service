'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')
const createBillRunJob = require('../../../../src/modules/billing/jobs/create-bill-run')

// Services
const batchService = require('../../../../src/modules/billing/services/batch-service')

// Models
const Batch = require('../../../../src/lib/models/batch')

const batchId = uuid()

const data = {
  eventId: 'test-event-id',
  batch: {
    id: batchId,
    type: Batch.BATCH_TYPE.annual
  }
}

experiment('modules/billing/jobs/create-bill-run', () => {
  let batch, queueManager

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus')
    sandbox.stub(batchJob, 'logOnCompleteError')
    sandbox.stub(batchJob, 'logOnComplete')
    sandbox.stub(batchJob, 'logHandlingError')

    batch = new Batch()
    batch.fromHash(data.batch)

    sandbox.stub(batchService, 'createChargeModuleBillRun').resolves(batch)
    sandbox.stub(batchService, 'setErrorStatus').resolves(batch)
    sandbox.stub(batchService, 'setStatus').resolves({ ...batch, status: 'processing' })

    queueManager = {
      add: sandbox.stub()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(createBillRunJob.jobName).to.equal('billing.create-bill-run')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = createBillRunJob.createMessage(
        batchId
      )

      expect(message).to.equal([
        'billing.create-bill-run',
        {
          batchId
        },
        {
          jobId: `billing.create-bill-run.${batchId}`
        }
      ])
    })
  })

  experiment('.handler', () => {
    let result, job

    experiment('when there is no error', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId
          }
        }
        result = await createBillRunJob.handler(job)
      })

      test('batchService.createChargeModuleBillRun is called with the correct batch ID', async () => {
        expect(batchService.createChargeModuleBillRun.calledWith(
          batchId
        )).to.be.true()
      })

      test('resolves with batch type', async () => {
        expect(result.type).to.equal(data.batch.type)
      })
    })

    experiment('when there is an error', () => {
      let error
      const err = new Error('oops!')

      beforeEach(async () => {
        job = {
          data: {
            batch: data.batch,
            eventId: data.eventId
          }
        }
        batchService.createChargeModuleBillRun.rejects(err)
        const func = () => createBillRunJob.handler(job)
        error = await expect(func()).to.reject()
      })

      test('the error is logged and batch marked as error status', async () => {
        const { args } = batchJob.logHandlingErrorAndSetBatchStatus.lastCall
        expect(args[0]).to.equal(job)
        expect(args[1] instanceof Error).to.be.true()
        expect(args[2]).to.equal(Batch.BATCH_ERROR_CODE.failedToCreateBillRun)
      })

      test('re-throws the error', async () => {
        expect(error).to.equal(err)
      })
    })
  })

  experiment('.onComplete', () => {
    experiment('for an annual batch', () => {
      const job = {
        data: {
          batchId
        },
        returnvalue: {
          type: Batch.BATCH_TYPE.annual
        }
      }

      experiment('when publishing the next job succeeds', () => {
        test('the next job is published', async () => {
          await createBillRunJob.onComplete(job, queueManager)
          expect(queueManager.add.calledWith(
            'billing.populate-batch-charge-versions',
            batchId
          )).to.be.true()
        })
      })

      experiment('when publishing the next job fails', () => {
        beforeEach(async () => {
          queueManager.add.rejects()
        })

        test('a message is logged', async () => {
          await createBillRunJob.onComplete(job, queueManager)
          expect(batchJob.logOnCompleteError.calledWith(job)).to.be.true()
        })
      })
    })

    experiment('for a two-part tariff batch', () => {
      const job = {
        data: {
          batchId
        },
        returnvalue: {
          type: Batch.BATCH_TYPE.twoPartTariff
        }
      }

      experiment('when publishing the next job succeeds', () => {
        test('the next job is published', async () => {
          await createBillRunJob.onComplete(job, queueManager)
          expect(queueManager.add.calledWith(
            'billing.populate-batch-charge-versions',
            batchId
          )).to.be.true()
        })
      })
    })

    experiment('for a supplementary batch', () => {
      const job = {
        data: {
          batchId
        },
        returnvalue: {
          type: Batch.BATCH_TYPE.supplementary
        }
      }

      experiment('when publishing the next job succeeds', () => {
        test('the rebilling job is published', async () => {
          await createBillRunJob.onComplete(job, queueManager)
          expect(queueManager.add.calledWith(
            'billing.rebilling',
            batchId
          )).to.be.true()
        })
      })
    })
  })
})
