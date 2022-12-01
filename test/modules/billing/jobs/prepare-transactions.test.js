const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { v4: uuid } = require('uuid')

const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { logger } = require('../../../../src/logger')
const prepareTransactions = require('../../../../src/modules/billing/jobs/prepare-transactions')
const refreshTotals = require('../../../../src/modules/billing/jobs/refresh-totals')

const billingTransactionsRepo = require('../../../../src/lib/connectors/repos/billing-transactions')

const batchService = require('../../../../src/modules/billing/services/batch-service')
const supplementaryBillingService = require('../../../../src/modules/billing/services/supplementary-billing-service')
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')

const Batch = require('../../../../src/lib/models/batch')

const BATCH_ID = uuid()

const data = {
  eventId: 'test-event-id',
  transactions: [{
    billingTransactionId: '00000000-0000-0000-0000-000000000001',
    status: 'candidate'
  }, {
    billingTransactionId: '00000000-0000-0000-0000-000000000002',
    status: 'candidate'
  }],
  batch: {
    id: BATCH_ID
  }
}

experiment('modules/billing/jobs/prepare-transactions', () => {
  let batch, queueManager

  beforeEach(async () => {
    sandbox.stub(logger, 'info')
    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus')
    sandbox.stub(batchJob, 'logOnCompleteError')

    batch = new Batch(BATCH_ID)
    sandbox.stub(batchService, 'getBatchById').resolves(batch)
    sandbox.stub(batchService, 'setErrorStatus').resolves()
    sandbox.stub(batchService, 'requestCMBatchGeneration').resolves()

    sandbox.stub(supplementaryBillingService, 'processBatch')
    sandbox.stub(batch, 'isSupplementary')

    sandbox.stub(billingTransactionsRepo, 'findByBatchId').resolves(data.transactions)

    queueManager = {
      add: sandbox.stub()
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(prepareTransactions.jobName).to.equal('billing.prepare-transactions')
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = prepareTransactions.createMessage(BATCH_ID, 'supplementary', 'alcs')
    })

    test('creates the expected message array', async () => {
      expect(message).to.equal([
        'billing.prepare-transactions',
        {
          batchId: BATCH_ID,
          batchType: 'supplementary',
          scheme: 'alcs'
        },
        {
          jobId: `billing.prepare-transactions.${BATCH_ID}`
        }
      ])
    })
  })

  experiment('.handler', () => {
    let result, job

    beforeEach(async () => {
      job = {
        data: {
          batch: data.batch
        },
        name: `billing.prepare-transactions.${BATCH_ID}`
      }
    })

    experiment('if there is an error', () => {
      const err = new Error('oops')
      let error

      beforeEach(async () => {
        batchService.getBatchById.rejects(err)
        error = await expect(prepareTransactions.handler(job))
          .to.reject()
      })

      test('the error is logged and batch marked as error status', async () => {
        const { args } = batchJob.logHandlingErrorAndSetBatchStatus.lastCall
        expect(args[0]).to.equal(job)
        expect(args[1] instanceof Error).to.be.true()
        expect(args[2]).to.equal(Batch.BATCH_ERROR_CODE.failedToPrepareTransactions)
      })

      test('re-throws the error', async () => {
        expect(error).to.equal(err)
      })
    })

    experiment('for a supplementary batch', () => {
      beforeEach(async () => {
        batch.isSupplementary.returns(true)
        result = await prepareTransactions.handler(job)
      })

      test('a message is logged', async () => {
        const [loggedJob] = batchJob.logHandling.lastCall.args
        expect(loggedJob).to.equal(job)
      })

      test('the supplementary batch service is called', async () => {
        expect(
          supplementaryBillingService.processBatch.calledWith(BATCH_ID)
        ).to.be.true()
      })

      test('calls repos.billingTransactions.getByBatchId with batch ID', async () => {
        const [batchId] = billingTransactionsRepo.findByBatchId.lastCall.args
        expect(batchId).to.equal(BATCH_ID)
      })

      test('resolves with candidate transaction IDs', async () => {
        expect(result.billingTransactionIds).to.equal([
          data.transactions[0].billingTransactionId,
          data.transactions[1].billingTransactionId
        ])
      })
    })

    experiment('for a non-supplementary batch', () => {
      beforeEach(async () => {
        batch.isSupplementary.returns(false)
        result = await prepareTransactions.handler(job)
      })

      test('the supplementary batch service is not called', async () => {
        expect(
          supplementaryBillingService.processBatch.callCount
        ).to.equal(0)
      })
    })
  })

  experiment('onComplete', () => {
    let job

    beforeEach(async () => {
      job = {
        data: {
          batchId: BATCH_ID
        },
        returnvalue: {
          billingTransactionIds: [
            data.transactions[0].billingTransactionId,
            data.transactions[1].billingTransactionId
          ]
        }
      }
    })

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await prepareTransactions.onComplete(job, queueManager)
      })

      test('adds a message to the queue for every transaction', async () => {
        expect(queueManager.add.callCount).to.equal(2)
        expect(queueManager.add.firstCall.calledWith(
          'billing.create-charge', BATCH_ID, data.transactions[0].billingTransactionId
        )).to.be.true()
        expect(queueManager.add.secondCall.calledWith(
          'billing.create-charge', BATCH_ID, data.transactions[1].billingTransactionId
        )).to.be.true()
      })

      test('charge module batch summary is not generated', () => {
        expect(batchService.requestCMBatchGeneration.called).to.be.false()
      })
    })

    experiment('when there is an error', () => {
      let err

      beforeEach(async () => {
        err = new Error('oops')
        queueManager.add.rejects(err)
        await prepareTransactions.onComplete(job, queueManager)
      })

      test('a message is logged', async () => {
        expect(batchJob.logOnCompleteError.calledWith(job, err)).to.be.true()
      })
    })

    experiment('when there are 0 transactions to process', () => {
      beforeEach(async () => {
        job.returnvalue.billingTransactionIds = []
        await prepareTransactions.onComplete(job, queueManager)
      })

      test('charge module batch summary is generated', () => {
        expect(batchService.requestCMBatchGeneration.calledWith(BATCH_ID)).to.be.true()
      })

      test('the refresh totals job is added to the message queue', () => {
        expect(queueManager.add.callCount).to.equal(1)
        expect(queueManager.add.calledWith(
          refreshTotals.jobName, BATCH_ID
        )).to.be.true()
      })
    })
  })
})
