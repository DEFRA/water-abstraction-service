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
  beforeEach(async () => {
    sandbox.stub(logger, 'info');

    sandbox.stub(repos.billingTransactions, 'getByBatchId').resolves(data.transactions);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(prepareTransactions.jobName).to.equal('billing.prepare-transactions');
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = prepareTransactions.createMessage(data.eventId, data.batch);
    });

    test('using the expected job name', async () => {
      expect(message.name).to.equal(prepareTransactions.jobName);
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
        }
      };

      result = await prepareTransactions.handler(job);
    });

    test('a message is logged', async () => {
      const [message] = logger.info.lastCall.args;
      expect(message).to.equal('Handling billing.prepare-transactions');
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
});
