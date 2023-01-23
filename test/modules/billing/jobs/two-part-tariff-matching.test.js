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

const twoPartTariffMatchingJob = require('../../../../src/modules/billing/jobs/two-part-tariff-matching')

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')
const { BATCH_TYPE, BATCH_STATUS } = require('../../../../src/lib/models/batch')

const batchService = require('../../../../src/modules/billing/services/batch-service')
const twoPartTariffService = require('../../../../src/modules/billing/services/two-part-tariff')
const billingVolumeService = require('../../../../src/modules/billing/services/billing-volumes-service')

const Batch = require('../../../../src/lib/models/batch')

const batchId = uuid()
const eventId = 'test-event-id'

experiment('modules/billing/jobs/two-part-tariff-matching', () => {
  let batch, queueManager

  beforeEach(async () => {
    batch = new Batch(batchId)
    batch.type = BATCH_TYPE.twoPartTariff
    batch.status = BATCH_STATUS.processing

    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus')
    sandbox.stub(batchJob, 'logOnCompleteError')

    sandbox.stub(batchService, 'getBatchById')
    sandbox.stub(batchService, 'setStatusToReview')
    sandbox.stub(batchService, 'setErrorStatus')

    sandbox.stub(twoPartTariffService, 'processBatch')

    sandbox.stub(billingVolumeService, 'getUnapprovedVolumesForBatchCount')

    queueManager = {
      add: sandbox.stub()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('.jobName', async () => {
    expect(twoPartTariffMatchingJob.jobName).to.equal('billing.two-part-tariff-matching')
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = twoPartTariffMatchingJob.createMessage(batchId)
    })

    test('creates the expected message array', async () => {
      expect(message).to.equal([
        'billing.two-part-tariff-matching',
        {
          batchId
        },
        {
          jobId: `billing.two-part-tariff-matching.${batchId}`
        }
      ])
    })
  })

  experiment('.handler', () => {
    let result

    const job = {
      data: {
        eventId,
        batch: {
          id: batchId
        }
      }
    }

    experiment('when the batch status is not "processing"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.ready
        batchService.getBatchById.resolves(batch)
      })

      test('an error is logged an rethrown', async () => {
        const func = () => twoPartTariffMatchingJob.handler(job)
        const err = await expect(func()).to.reject()
        expect(batchJob.logHandlingErrorAndSetBatchStatus.calledWith(
          job,
          err,
          Batch.BATCH_ERROR_CODE.failedToProcessTwoPartTariff
        )).to.be.true()
        expect(err.message).to.equal(`Expected queued,processing,sending batch status, but got ${Batch.BATCH_STATUS.ready}`)
      })
    })

    experiment('when the batch status is "processing" and there are TPT volumes to review', () => {
      beforeEach(async () => {
        billingVolumeService.getUnapprovedVolumesForBatchCount.resolves(5)
        batch.status = Batch.BATCH_STATUS.processing
        batchService.getBatchById.resolves(batch)
        result = await twoPartTariffMatchingJob.handler(job)
      })

      test('the two-part tariff matching is invoked', async () => {
        expect(twoPartTariffService.processBatch.calledWith(batch)).to.be.true()
      })

      test('the batch is set to review', async () => {
        expect(batchService.setStatusToReview.calledWith(batchId)).to.be.true()
      })

      test('a review is needed', async () => {
        expect(result.isReviewNeeded).to.be.true()
      })
    })

    experiment('when the batch status is "processing" and there are no TPT volumes to review', () => {
      beforeEach(async () => {
        billingVolumeService.getUnapprovedVolumesForBatchCount.resolves(0)
        batch.status = Batch.BATCH_STATUS.processing
        batchService.getBatchById.resolves(batch)
        result = await twoPartTariffMatchingJob.handler(job)
      })

      test('the two-part tariff matching is invoked', async () => {
        expect(twoPartTariffService.processBatch.calledWith(batch)).to.be.true()
      })

      test('the batch is not set to review', async () => {
        expect(batchService.setStatusToReview.called).to.be.false()
      })

      test('a review is not needed', async () => {
        expect(result.isReviewNeeded).to.be.false()
      })
    })
  })

  experiment('.onComplete', () => {
    let job

    experiment('when review is needed', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId
          },
          returnvalue: {
            isReviewNeeded: true
          }
        }
        await twoPartTariffMatchingJob.onComplete(job, queueManager)
      })

      test('no jobs are added to the queue', async () => {
        expect(queueManager.add.called).to.be.false()
      })
    })

    experiment('when no review is needed', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId
          },
          returnvalue: {
            isReviewNeeded: false
          }
        }
        await twoPartTariffMatchingJob.onComplete(job, queueManager)
      })

      test('the process charge versions job is added to the queue', async () => {
        expect(queueManager.add.calledWith(
          'billing.process-charge-versions', batchId
        )).to.be.true()
      })
    })

    experiment('when there is an error', () => {
      const err = new Error('oops!')

      beforeEach(async () => {
        job = {
          data: {
            batchId
          },
          returnvalue: {
            isReviewNeeded: false
          }
        }
        queueManager.add.rejects(err)
        await twoPartTariffMatchingJob.onComplete(job, queueManager)
      })

      test('the error is logged', async () => {
        expect(batchJob.logOnCompleteError.calledWith(
          job, err
        )).to.be.true()
      })
    })
  })
})
