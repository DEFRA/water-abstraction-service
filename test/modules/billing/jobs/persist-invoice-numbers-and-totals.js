'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const persistInvoiceNumbersAndTotals = require('../../../../src/modules/billing/jobs/persist-invoice-numbers-and-totals');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const Batch = require('../../../../src/lib/models/batch');
const { logger } = require('../../../../src/logger');

const BATCH_ID = uuid();

experiment('modules/billing/jobs/persist-invoice-numbers-and-totals', () => {
  let batch;

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'logHandlingError');

    batch = new Batch().fromHash({
      id: BATCH_ID,
      status: Batch.BATCH_STATUS.sent
    });
    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(batchService, 'persistInvoiceNumbersAndTotals').resolves();
    sandbox.stub(batchService, 'setStatus').resolves();

    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.jobName', () => {
    test('is set to the expected value', async () => {
      expect(persistInvoiceNumbersAndTotals.jobName).to.equal('billing.persist-invoice-numbers-and-totals');
    });
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = persistInvoiceNumbersAndTotals.createMessage(BATCH_ID);
    });

    test('creates the expected message array', async () => {
      const [name, data, options] = message;
      expect(name).to.equal('billing.persist-invoice-numbers-and-totals');
      expect(data).to.equal({ batchId: BATCH_ID });

      expect(options.jobId).to.startWith(`billing.persist-invoice-numbers-and-totals.${BATCH_ID}.`);
      expect(options.attempts).to.equal(10);
      expect(options.backoff).to.equal({
        type: 'exponential',
        delay: 5000
      });
    });
  });

  experiment('.handler', () => {
    let job;
    beforeEach(async () => {
      job = {
        data: {
          batchId: BATCH_ID
        }
      };
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        batchService.persistInvoiceNumbersAndTotals.resolves(true);
        await persistInvoiceNumbersAndTotals.handler(job);
      });

      test('logs an info message', async () => {
        expect(batchJob.logHandling.calledWith(job)).to.be.true();
      });

      test('gets the batch with invoices by id', async () => {
        expect(batchService.getBatchById.calledWith(BATCH_ID, true)).to.be.true();
      });

      test('persists invoice numbers and totals for batch invoices', async () => {
        expect(batchService.persistInvoiceNumbersAndTotals.calledWith(batch)).to.be.true();
      });

      test('the batch status is updated to sent', async () => {
        expect(batchService.setStatus.calledWith(batch.id, 'sent')).to.be.true();
      });

      test('no error is logged', async () => {
        expect(batchJob.logHandlingError.called).to.be.false();
      });
    });

    experiment('when there are errors', () => {
      let error;

      beforeEach(async () => {
        error = new Error('refresh error');
        batchService.persistInvoiceNumbersAndTotals.rejects(error);
        await expect(persistInvoiceNumbersAndTotals.handler(job)).to.reject();
      });

      test('the error is logged', async () => {
        expect(batchJob.logHandlingError.called).to.be.true();
      });
    });
  });

  experiment('.onFailed', () => {
    let job, err;

    beforeEach(() => {
      job = {
        name: 'test-job',
        id: 'test-job-id',
        data: {
          batchId: BATCH_ID
        },
        attemptsMade: 5,
        opts: {
          attempts: 10
        }
      };
      err = new Error('oops');
    });

    experiment('when the attempt to persist invoice numbers and totals failed but is not the final one', () => {
      beforeEach(async () => {
        await persistInvoiceNumbersAndTotals.onFailed(job, err);
      });

      test('a normal error is logged', async () => {
        const [errMsg, error] = logger.error.lastCall.args;
        expect(errMsg).to.equal('Job test-job test-job-id failed');
        expect(error).to.equal(err);
      });
    });

    experiment('on the final attempt to persist invoice numbers and totals', () => {
      beforeEach(async () => {
        job.attemptsMade = 10;
        await persistInvoiceNumbersAndTotals.onFailed(job, err);
      });

      test('the expected error is logged', async () => {
        const [errMsg, error] = logger.error.lastCall.args;
        expect(errMsg).to.equal(`CM transactions for batch ${BATCH_ID} not retrieved after ${job.attemptsMade} attempts`);
        expect(error).to.equal(err);
      });
    });
  });

  experiment('.onComplete', () => {
    let job;

    beforeEach(async () => {
      job = {
        name: 'billing.persist-invoice-numbers-and-totals',
        id: 'test-job-id'
      };

      await persistInvoiceNumbersAndTotals.onComplete(job);
    });

    test('logs an info message', () => {
      expect(batchJob.logOnComplete.calledWith(job)).to.be.true();
    });
  });
});
