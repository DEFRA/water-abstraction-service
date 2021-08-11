'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const rebillingJob = require('../../../../src/modules/billing/jobs/rebilling');

// Connectors
const { logger } = require('../../../../src/logger');

// Services
const batchService = require('../../../../src/modules/billing/services/batch-service');
const invoiceService = require('../../../../src/lib/services/invoice-service');
const rebillingService = require('../../../../src/modules/billing/services/rebilling-service');

// Models
const Batch = require('../../../../src/lib/models/batch');
const Region = require('../../../../src/lib/models/region');
const Invoice = require('../../../../src/lib/models/invoice');

const transactionId = uuid();
const batchId = uuid();
const regionId = uuid();
const invoiceId = uuid();

const createBatch = () => new Batch()
  .fromHash({
    id: batchId,
    region: new Region(regionId),
    status: Batch.BATCH_STATUS.processing
  });

const createInvoice = () =>
  new Invoice(invoiceId);

experiment('modules/billing/jobs/rebilling', () => {
  let batch, queueManager, invoice;

  beforeEach(async () => {
    batch = createBatch();
    invoice = createInvoice();

    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'logOnCompleteError');

    sandbox.stub(batchService, 'getBatchById');
    sandbox.stub(batchService, 'setErrorStatus');

    sandbox.stub(invoiceService, 'getInvoicesFlaggedForRebilling');
    sandbox.stub(invoiceService, 'updateInvoice').resolves();

    sandbox.stub(rebillingService, 'rebillInvoice');

    queueManager = {
      add: sandbox.stub()
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(rebillingJob.jobName).to.equal('billing.rebilling');
  });

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = rebillingJob.createMessage(
        batchId,
        transactionId
      );

      expect(message).to.equal([
        'billing.rebilling',
        {
          batchId
        },
        {
          attempts: 6,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          jobId: `billing.rebilling.${batchId}`
        }
      ]);
    });
  });

  experiment('.handler', () => {
    let job;

    beforeEach(async () => {
      job = {
        data: {
          batchId
        }
      };
      invoiceService.getInvoicesFlaggedForRebilling.resolves([
        invoice
      ]);
    });

    experiment('when the batch status is "processing"', () => {
      beforeEach(async () => {
        batchService.getBatchById.resolves(batch);
        await rebillingJob.handler(job);
      });

      test('gets the batch', async () => {
        expect(batchService.getBatchById.calledWith(batchId)).to.be.true();
      });

      test('gets the invoices flagged for rebilling in the batch region', async () => {
        expect(invoiceService.getInvoicesFlaggedForRebilling.calledWith(
          regionId
        )).to.be.true();
      });

      test('calls the .rebillInvoice service method for each invoice retrieved', async () => {
        expect(rebillingService.rebillInvoice.callCount).to.equal(1);
        expect(rebillingService.rebillInvoice.calledWith(
          batch, invoice.id
        )).to.be.true();
      });

      test('calls the .invoice service method for each invoice retrieved', async () => {
        expect(invoiceService.updateInvoice.callCount).to.equal(1);
        expect(invoiceService.updateInvoice.calledWith(
          invoice.id,
          { rebillingState: 'rebilled' }
        )).to.be.true();
      });
    });

    experiment('when the batch status is not "processing"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.error;
        batchService.getBatchById.resolves(batch);
      });

      test('the handler rejects with an error', async () => {
        const func = () => rebillingJob.handler(job);
        expect(func()).to.reject();
      });
    });
  });

  experiment('.onComplete', () => {
    let job;
    beforeEach(async () => {
      job = {
        data: {
          batchId
        }
      };
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        rebillingJob.onComplete(job, queueManager);
      });

      test('a job is published for each charge version year', async () => {
        expect(queueManager.add.callCount).to.equal(1);
        expect(queueManager.add.calledWith(
          'billing.populate-batch-charge-versions', batchId
        )).to.be.true();
      });
    });

    experiment('when there is an error', () => {
      let err;

      beforeEach(async () => {
        err = new Error('oops');
        queueManager.add.rejects(err);
        await rebillingJob.onComplete(job, queueManager);
      });

      test('a message is logged', async () => {
        expect(batchJob.logOnCompleteError.calledWith(job, err)).to.be.true();
      });
    });
  });

  experiment('.onFailedHandler', () => {
    let job;
    const err = new Error('oops');

    experiment('for a non-final attempt to process rebilling', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId
          },
          attemptsMade: 5,
          opts: {
            attempts: 10
          }
        };
        await rebillingJob.onFailed(job, err);
      });

      test('the batch is not updated', async () => {
        expect(batchService.setErrorStatus.called).to.be.false();
      });
    });

    experiment('for a non-final attempt to process rebilling', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId
          },
          attemptsMade: 10,
          opts: {
            attempts: 10
          }
        };
        await rebillingJob.onFailed(job, err);
      });

      test('the batch is updated', async () => {
        expect(batchService.setErrorStatus.calledWith(
          job.data.batchId, Batch.BATCH_ERROR_CODE.failedToProcessRebilling
        )).to.be.true();
      });
    });
  });
});
