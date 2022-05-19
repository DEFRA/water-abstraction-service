'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const uuid = require('uuid/v4')

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job')
const createChargeJob = require('../../../../src/modules/billing/jobs/create-charge')

// Connectors
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs')
const mappers = require('../../../../src/modules/billing/mappers')
const { logger } = require('../../../../src/logger')

// Services
const transactionService = require('../../../../src/modules/billing/services/transactions-service')
const batchService = require('../../../../src/modules/billing/services/batch-service')

// Models
const Batch = require('../../../../src/lib/models/batch')
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence')
const Invoice = require('../../../../src/lib/models/invoice')
const Transaction = require('../../../../src/lib/models/transaction')

const transactionId = uuid()
const batchId = uuid()
const chargeModuleBillRunId = uuid()

const { BATCH_ERROR_CODE } = require('../../../../src/lib/models/batch')

const data = {
  eventId: 'test-event-id',

  transaction: {
    billing_transaction_id: transactionId,
    charge_element_id: 'test-charge-element-id'
  },
  chargeModuleTransaction: {
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
  },
  chargeModuleResponse: {
    transaction: {
      id: 'd091a865-073c-4eb0-8e82-37c9a421ed68'
    }
  }
}

const createBatch = () => {
  // Create transaction
  const transaction = new Transaction(transactionId)
  transaction.status = Transaction.statuses.candidate

  // Create invoice licence
  const invoiceLicence = new InvoiceLicence()
  invoiceLicence.transactions = [transaction]

  // Create invoice
  const invoice = new Invoice()
  invoice.invoiceLicences = [invoiceLicence]

  // Create batch
  const batch = new Batch(batchId)
  batch.invoices = [invoice]
  batch.externalId = chargeModuleBillRunId

  return batch
}

experiment('modules/billing/jobs/create-charge', () => {
  let batch, queueManager

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling')
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus')
    sandbox.stub(batchJob, 'logHandlingError')
    sandbox.stub(batchJob, 'logOnComplete')
    sandbox.stub(batchJob, 'logOnCompleteError')

    queueManager = {
      add: sandbox.stub()
    }

    batch = createBatch()

    sandbox.stub(transactionService, 'getById').resolves(batch)
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

    sandbox.stub(chargeModuleBillRunConnector, 'addTransaction').resolves(data.chargeModuleResponse)
    sandbox.stub(chargeModuleBillRunConnector, 'generate').resolves()
    sandbox.stub(mappers.batch, 'modelToChargeModule').returns([data.chargeModuleTransaction])

    sandbox.stub(logger, 'error')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(createChargeJob.jobName).to.equal('billing.create-charge')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = createChargeJob.createMessage(
        batchId,
        transactionId
      )

      expect(message).to.equal([
        'billing.create-charge',
        {
          batchId,
          billingBatchTransactionId: transactionId
        },
        {
          attempts: 6,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          jobId: `billing.create-charge.${batchId}.${transactionId}`
        }
      ])
    })
  })

  experiment('.handler', () => {
    let result, job

    beforeEach(async () => {
      job = {
        data: {
          batchId,
          billingBatchTransactionId: transactionId
        }
      }
    })

    experiment('when there is no error', () => {
      beforeEach(async () => {
        result = await createChargeJob.handler(job)
      })

      test('the transaction is loaded within the context of its batch', async () => {
        expect(transactionService.getById.calledWith(transactionId)).to.be.true()
      })

      test('the batch is mapped to charge module transactions', async () => {
        const { args } = mappers.batch.modelToChargeModule.lastCall
        expect(args[0]).to.equal(batch)
      })

      test('the charge module payload is sent to the .createTransaction connector', async () => {
        const [externalId, payload] = chargeModuleBillRunConnector.addTransaction.lastCall.args
        expect(externalId).to.equal(batch.externalId)
        expect(payload).to.equal(data.chargeModuleTransaction)
      })

      test('the transaction is updated with the charge module response', async () => {
        const [id, response] = transactionService.updateWithChargeModuleResponse.lastCall.args
        expect(id).to.equal(transactionId)
        expect(response).to.equal(data.chargeModuleResponse)
      })

      test('the batchService.cleanup method is called', async () => {
        expect(batchService.cleanup.calledWith(
          batchId
        )).to.be.true()
      })

      test('the batch status is not changed', async () => {
        expect(batchService.setStatus.called).to.be.false()
      })

      test('resolves with boolean to indicate if batch ready', async () => {
        expect(result).to.equal(true)
      })
    })

    experiment('when the transaction is not in "candidate" status', () => {
      beforeEach(async () => {
        batch = createBatch()
        batch.invoices[0].invoiceLicences[0].transactions[0].status = Transaction.statuses.chargeCreated
        transactionService.getById.resolves(batch)
        result = await createChargeJob.handler(job)
      })

      test('the transaction is loaded within the context of its batch', async () => {
        expect(transactionService.getById.calledWith(transactionId)).to.be.true()
      })

      test('the charge module is never called', async () => {
        expect(chargeModuleBillRunConnector.addTransaction.called).to.be.false()
      })

      test('the transaction is never updated', async () => {
        expect(transactionService.updateWithChargeModuleResponse.called).to.be.false()
      })

      test('the batchService.cleanup method is called', async () => {
        expect(batchService.cleanup.calledWith(
          batchId
        )).to.be.true()
      })

      test('the batch status is not changed', async () => {
        expect(batchService.setStatus.called).to.be.false()
      })

      test('resolves with boolean to indicate if batch ready', async () => {
        expect(result).to.equal(true)
      })
    })

    experiment('when it is an sroc transaction', () => {
      beforeEach(async () => {
        batch = {
          scheme: 'sroc',
          status: 'candidate',
          billingInvoiceLicence: {
            billingInvoice: {
              billingBatch: {
                externalId: 'cm-batch-id'
              }
            }
          }
        };
        batch.status = Transaction.statuses.candidate;
        transactionService.getById.resolves(batch);
        result = await createChargeJob.handler(job);
      });

      test('the transaction is loaded within the context of its batch', async () => {
        expect(transactionService.getById.calledWith(transactionId)).to.be.true();
      });

      test('the charge module is never called', async () => {
        const args = chargeModuleBillRunConnector.addTransaction.lastCall.args;
        expect(args[0]).to.equal('cm-batch-id');
        expect(chargeModuleBillRunConnector.addTransaction.called).to.be.true();
      });

      test('the transaction is never updated', async () => {
        expect(transactionService.updateWithChargeModuleResponse.called).to.be.true();
      });
    });

    experiment('when there is an empty batch', () => {
      beforeEach(async () => {
        batchService.getTransactionStatusCounts.resolves({
          charge_created: 0,
          candidate: 0
        })
        result = await createChargeJob.handler(job)
      })

      test('the batchService.cleanup method is called', async () => {
        expect(batchService.cleanup.calledWith(
          batchId
        )).to.be.true()
      })

      test('resolves with boolean to indicate batch is ready', async () => {
        expect(result).to.equal(true)
      })
    })

    experiment('when there is 4xx error in the charge module', () => {
      const err = new Error('Test error')
      err.statusCode = 422

      beforeEach(async () => {
        chargeModuleBillRunConnector.addTransaction.rejects(err)
        await createChargeJob.handler(job)
      })

      test('sets the transaction status to error', async () => {
        const [id] = transactionService.setErrorStatus.lastCall.args
        expect(id).to.equal(data.transaction.billing_transaction_id)
      })

      test('the error is logged', async () => {
        expect(batchJob.logHandlingError.calledWith(
          job, err
        )).to.be.true()
      })

      test('the batch status is not set to "error"', async () => {
        expect(batchService.setErrorStatus.called).to.be.false()
      })
    })

    experiment('when there is a 5xx error', () => {
      const err = new Error('Test error')
      err.statusCode = 500
      let error

      beforeEach(async () => {
        chargeModuleBillRunConnector.addTransaction.rejects(err)
        const func = () => createChargeJob.handler(job)
        error = await expect(func()).to.reject()
      })

      test('the error is not logged because this is done by the failed handler', async () => {
        expect(batchJob.logHandlingError.calledWith(
          job, err
        )).to.be.true()
      })

      test('throws an error to go to the retry handler', async () => {
        expect(error.message).to.equal('Test error')
      })
    })
  })

  experiment('.onComplete', () => {
    experiment('when a batch is not ready', () => {
      beforeEach(async () => {
        const job = {
          data: {
            batchId
          },
          returnvalue: false
        }
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

    experiment('when a batch is ready', () => {
      beforeEach(async () => {
        const job = {
          data: {
            batchId
          },
          returnvalue: true
        }
        await createChargeJob.onComplete(job, queueManager)
      })

      test('charge module batch generation is requested', async () => {
        expect(batchService.requestCMBatchGeneration.called).to.be.true()
      })

      test('the next job is published', async () => {
        expect(queueManager.add.calledWith(
          'billing.refresh-totals', batchId
        )).to.be.true()
      })
    })

    experiment('when there is an error', () => {
      const job = {
        data: {
          batchId
        },
        returnvalue: {
          isReady: true,
          isEmptyBatch: false
        }
      }

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
    let job
    const err = new Error('oops')

    experiment('when the attempt to create the charge in the CM failed but is not the final one', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId,
            billingBatchTransactionId: await uuid()
          },
          attemptsMade: 5,
          opts: {
            attempts: 10
          }
        }
        await createChargeJob.onFailed(job, err)
      })

      test('the batch is not updated', async () => {
        expect(batchService.setErrorStatus.called).to.be.false()
      })
    })

    experiment('on the final attempt to create the charge in the CM', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId,
            billingBatchTransactionId: await uuid()
          },
          attemptsMade: 10,
          opts: {
            attempts: 10
          }
        }
        await createChargeJob.onFailed(job, err)
      })

      test('the batch is not updated', async () => {
        expect(batchService.setErrorStatus.calledWith(
          job.data.batchId, BATCH_ERROR_CODE.failedToCreateCharge
        )).to.be.true()
      })
    })
  })
})
