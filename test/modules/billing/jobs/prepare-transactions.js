const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { logger } = require('../../../../src/logger');
const prepareTransactions = require('../../../../src/modules/billing/jobs/prepare-transactions');
const repos = require('../../../../src/lib/connectors/repository');

const batchService = require('../../../../src/modules/billing/services/batch-service');
const supplementaryBillingService = require('../../../../src/modules/billing/services/supplementary-billing-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');

const Batch = require('../../../../src/lib/models/batch');

const data = {
  eventId: 'test-event-id',
  transactions: [{
    billing_transaction_id: '00000000-0000-0000-0000-000000000001'
  }],
  batch: {
    billing_batch_id: '00000000-0000-0000-0000-000000000002'
  }
};

experiment('modules/billing/jobs/process-charge-version', () => {
  let batch;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingError');

    batch = new Batch(data.batch.billing_batch_id);
    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(batchService, 'setErrorStatus').resolves();
    sandbox.stub(repos.billingTransactions, 'getByBatchId').resolves(data.transactions);
    sandbox.stub(supplementaryBillingService, 'processBatch');
    sandbox.stub(batch, 'isSupplementary');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(prepareTransactions.jobName).to.equal('billing.prepare-transactions.*');
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = prepareTransactions.createMessage(data.eventId, data.batch);
    });

    test('using the expected job name', async () => {
      expect(message.name).to.equal('billing.prepare-transactions.00000000-0000-0000-0000-000000000002');
    });

    test('includes a data object with the event id', async () => {
      expect(message.data.eventId).to.equal(data.eventId);
    });

    test('includes a data object with the batch', async () => {
      expect(message.data.batch).to.equal(data.batch);
    });
  });

  experiment('.handler', () => {
    let result, job;

    beforeEach(async () => {
      job = {
        data: {
          batch: data.batch
        },
        name: 'billing.prepare-transactions.00000000-0000-0000-0000-000000000002'
      };
    });

    experiment('if there is an error', () => {
      test('the error details are logged', async () => {
        const error = new Error('oops');
        batchService.getBatchById.rejects(error);

        await expect(prepareTransactions.handler(job))
          .to.reject();

        const errorArgs = batchJob.logHandlingError.lastCall.args;
        expect(errorArgs[0]).to.equal(job);
        expect(errorArgs[1]).to.equal(error);
      });
    });

    experiment('for a supplementary batch', () => {
      beforeEach(async () => {
        batch.isSupplementary.returns(true);
        result = await prepareTransactions.handler(job);
      });

      test('a message is logged', async () => {
        const [loggedJob] = batchJob.logHandling.lastCall.args;
        expect(loggedJob).to.equal(job);
      });

      test('the supplementary batch service is called', async () => {
        expect(
          supplementaryBillingService.processBatch.calledWith(data.batch.billing_batch_id)
        ).to.be.true();
      });

      test('calls repos.billingTransactions.getByBatchId with batch ID', async () => {
        const [batchId] = repos.billingTransactions.getByBatchId.lastCall.args;
        expect(batchId).to.equal(data.batch.billing_batch_id);
      });

      test('resolves with batch and transactions', async () => {
        expect(result.batch).to.equal(data.batch);
        expect(result.transactions).to.equal(data.transactions);
      });
    });

    experiment('for a non-supplementary batch', () => {
      beforeEach(async () => {
        batch.isSupplementary.returns(false);
        result = await prepareTransactions.handler(job);
      });

      test('the supplementary batch service is not called', async () => {
        expect(
          supplementaryBillingService.processBatch.callCount
        ).to.equal(0);
      });
    });
  });
});
