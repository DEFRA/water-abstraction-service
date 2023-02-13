'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')
const createChargeJob = require('../../../../src/modules/billing/jobs/create-charge')

// Connectors
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs')
const mappers = require('../../../../src/modules/billing/mappers')

// Services
const transactionService = require('../../../../src/modules/billing/services/transactions-service')
const batchService = require('../../../../src/modules/billing/services/batch-service')

// Models
const Batch = require('../../../../src/lib/models/batch')
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence')
const Invoice = require('../../../../src/lib/models/invoice')
const Transaction = require('../../../../src/lib/models/transaction')

const { BATCH_ERROR_CODE } = require('../../../../src/lib/models/batch')

const job = {
  data: {
    batchId: '7eb70e4a-a5b0-4509-ae86-14a4cf55fe82',
    billingBatchTransactionId: 'fef6bc45-ffba-48a9-8fa0-456ac51d6f3a',
    lastOfUs: false
  }
}

const chargeModuleResponse = {
  transaction: {
    id: 'd091a865-073c-4eb0-8e82-37c9a421ed68'
  }
}

const chargeModuleTransaction = {
  periodStart: '01-APR-2019',
  periodEnd: '31-MAR-2020',
  credit: false,
  billableDays: 366,
  authorisedDays: 366,
  volume: 5.64,
  twoPartTariff: false,
  compensationCharge: false,
  section126Factor: 1,
  section127Agreement: false,
  section130Agreement: false,
  customerReference: 'A12345678A',
  lineDescription: 'Tiny pond',
  chargePeriod: '01-APR-2019 - 31-MAR-2020',
  batchNumber: 'd65bf89e-4a84-4f2e-8fc1-ebc5ff08c125',
  source: 'Supported',
  season: 'Summer',
  loss: 'Low',
  eiucSource: 'Other',
  chargeElementId: '29328315-9b24-473b-bde7-02c60e881501',
  waterUndertaker: true,
  regionalChargingArea: 'Anglian',
  licenceNumber: '01/123/ABC',
  region: 'A',
  areaCode: 'ARCA'
}

const loadTestTransaction = () => {
  // Create transaction
  const transaction = new Transaction(job.data.billingBatchTransactionId)
  transaction.status = Transaction.statuses.candidate

  // Create invoice licence
  const invoiceLicence = new InvoiceLicence()
  invoiceLicence.transactions = [transaction]

  // Create invoice
  const invoice = new Invoice()
  invoice.invoiceLicences = [invoiceLicence]

  // Create batch
  const batch = new Batch(job.data.batchId)
  batch.invoices = [invoice]
  batch.externalId = 'dac89570-7f44-4f94-b2fb-4722f2fecce0'

  return batch
}

experiment('modules/billing/jobs/create-charge', () => {
  let transaction, queueManager

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logInfo')
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus')
    sandbox.stub(batchJob, 'logHandlingError')
    sandbox.stub(batchJob, 'logOnComplete')
    sandbox.stub(batchJob, 'logOnCompleteError')

    queueManager = {
      add: sandbox.stub()
    }

    transaction = loadTestTransaction()

    sandbox.stub(transactionService, 'getById').resolves(transaction)
    sandbox.stub(transactionService, 'updateWithChargeModuleResponse').resolves()
    sandbox.stub(transactionService, 'setErrorStatus').resolves()

    sandbox.stub(batchService, 'setErrorStatus').resolves()
    sandbox.stub(batchService, 'getBatchById').resolves({
      externalId: 'test-external-id'
    })
    sandbox.stub(batchService, 'setStatus')
    sandbox.stub(batchService, 'getTransactionStatusCounts').resolves({
      candidate: 0,
      charge_created: 4
    })
    sandbox.stub(batchService, 'cleanup')
    sandbox.stub(batchService, 'requestCMBatchGeneration')

    sandbox.stub(chargeModuleBillRunConnector, 'addTransaction').resolves(chargeModuleResponse)
    sandbox.stub(chargeModuleBillRunConnector, 'generate').resolves()
    sandbox.stub(mappers.batch, 'modelToChargeModule').returns([chargeModuleTransaction])
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(createChargeJob.jobName).to.equal('billing.create-charge')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const { batchId, billingBatchTransactionId } = job.data

      const result = createChargeJob.createMessage(batchId, billingBatchTransactionId, false)

      expect(result).to.equal([
        'billing.create-charge',
        job.data,
        {
          jobId: `billing.create-charge.${batchId}.${billingBatchTransactionId}`
        }
      ])
    })
  })

  experiment('.handler', () => {
    experiment('when there is no error', () => {
      beforeEach(async () => {
        await createChargeJob.handler(job)
      })

      test('the transaction is loaded', async () => {
        expect(transactionService.getById.calledWith(job.data.billingBatchTransactionId)).to.be.true()
      })

      test('the transaction is mapped to a charge module transaction', async () => {
        const { args } = mappers.batch.modelToChargeModule.lastCall
        expect(args[0]).to.equal(transaction)
      })

      test('the charge module payload is sent to the .createTransaction connector', async () => {
        const [externalId, payload] = chargeModuleBillRunConnector.addTransaction.lastCall.args
        expect(externalId).to.equal(transaction.externalId)
        expect(payload).to.equal(chargeModuleTransaction)
      })

      test('the transaction is updated with the charge module response', async () => {
        const [id, response] = transactionService.updateWithChargeModuleResponse.lastCall.args
        expect(id).to.equal(job.data.billingBatchTransactionId)
        expect(response).to.equal(chargeModuleResponse)
      })

      test('the batch status is not changed', async () => {
        expect(batchService.setStatus.called).to.be.false()
      })
    })

    experiment('when the transaction is not in "candidate" status', () => {
      beforeEach(async () => {
        transaction.invoices[0].invoiceLicences[0].transactions[0].status = Transaction.statuses.chargeCreated
        transactionService.getById.resolves(transaction)
        await createChargeJob.handler(job)
      })

      test('the transaction is loaded', async () => {
        expect(transactionService.getById.calledWith(job.data.billingBatchTransactionId)).to.be.true()
      })

      test('the transaction is never mapped to a charge module transaction', async () => {
        expect(mappers.batch.modelToChargeModule.called).to.be.false()
      })

      test('the charge module is never called', async () => {
        expect(chargeModuleBillRunConnector.addTransaction.called).to.be.false()
      })

      test('the transaction is never updated', async () => {
        expect(transactionService.updateWithChargeModuleResponse.called).to.be.false()
      })

      test('the batch status is not changed', async () => {
        expect(batchService.setStatus.called).to.be.false()
      })
    })

    experiment('when it is an sroc transaction', () => {
      beforeEach(async () => {
        transaction = {
          scheme: 'sroc',
          status: 'candidate',
          billingInvoiceLicence: {
            billingInvoice: {
              billingBatch: {
                externalId: 'cm-batch-id'
              }
            }
          }
        }
        transaction.status = Transaction.statuses.candidate
        transactionService.getById.resolves(transaction)
        await createChargeJob.handler(job)
      })

      test('the transaction is loaded', async () => {
        expect(transactionService.getById.calledWith(job.data.billingBatchTransactionId)).to.be.true()
      })

      test('the transaction is mapped to a charge module transaction', async () => {
        const { args } = mappers.batch.modelToChargeModule.lastCall
        expect(args[0]).to.equal(transaction)
      })

      test('the charge module payload is sent to the .createTransaction connector', async () => {
        const args = chargeModuleBillRunConnector.addTransaction.lastCall.args
        expect(args[0]).to.equal('cm-batch-id')
        expect(chargeModuleBillRunConnector.addTransaction.called).to.be.true()
      })

      test('the transaction is updated with the charge module response', async () => {
        expect(transactionService.updateWithChargeModuleResponse.called).to.be.true()
      })

      test('the batch status is not changed', async () => {
        expect(batchService.setStatus.called).to.be.false()
      })
    })

    experiment('when the request to the Charging Module errors', () => {
      const err = new Error('Test error')

      beforeEach(async () => {
        chargeModuleBillRunConnector.addTransaction.rejects(err)
      })

      test('sets the transaction status to error', async () => {
        await expect(createChargeJob.handler(job)).to.reject()

        const [id] = transactionService.setErrorStatus.lastCall.args
        expect(id).to.equal(job.data.billingBatchTransactionId)
      })

      test('the error is logged', async () => {
        await expect(createChargeJob.handler(job)).to.reject()
        expect(batchJob.logHandlingError.calledWith(job, err)).to.be.true()
      })

      test('the batch status is not set to "error"', async () => {
        await expect(createChargeJob.handler(job)).to.reject()
        expect(batchService.setErrorStatus.called).to.be.false()
      })
    })
  })

  experiment('.onComplete', () => {
    experiment('when it is not the last of the create charge jobs', () => {
      beforeEach(async () => {
        await createChargeJob.onComplete(job, queueManager)
      })

      test('an info message is logged', async () => {
        expect(batchJob.logOnComplete.called).to.be.true()
      })

      test('no further jobs are published', async () => {
        expect(queueManager.add.called).to.be.false()
      })

      test('no error is logged', async () => {
        expect(batchJob.logOnCompleteError.called).to.be.false()
      })
    })

    experiment('when it is the last of the create charge jobs', () => {
      beforeEach(async () => {
        job.data.lastOfUs = true
        await createChargeJob.onComplete(job, queueManager)
      })

      test('charge module batch generation is requested', async () => {
        expect(batchService.requestCMBatchGeneration.called).to.be.true()
      })

      test('the batchService.cleanup method is called', async () => {
        expect(batchService.cleanup.calledWith(job.data.batchId)).to.be.true()
      })

      test('the next job is published', async () => {
        expect(queueManager.add.calledWith('billing.refresh-totals', job.data.batchId)).to.be.true()
      })
    })

    experiment('when there is an error', () => {
      beforeEach(() => {
        job.data.lastOfUs = true
      })

      const err = new Error('Test error')

      beforeEach(async () => {
        queueManager.add.rejects(err)
        await createChargeJob.onComplete(job, queueManager)
      })

      test('an error is logged', async () => {
        expect(batchJob.logOnCompleteError.calledWith(job, err)).to.be.true()
      })
    })
  })

  experiment('.onFailedHandler', () => {
    const err = new Error('oops')

    experiment('when the attempt to create the charge in the CM failed', () => {
      test('the batch status is updated to errored', async () => {
        await createChargeJob.onFailed(job, err)

        expect(batchJob.logHandlingErrorAndSetBatchStatus.calledWith(
          job, err, BATCH_ERROR_CODE.failedToCreateCharge
        )).to.be.true()
      })
    })
  })
})
