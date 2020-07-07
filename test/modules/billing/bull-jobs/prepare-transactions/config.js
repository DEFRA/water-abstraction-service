'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { logger } = require('../../../../../src/logger');
const jobConfig = require('../../../../../src/modules/billing/bull-jobs/prepare-transactions/config');
const createChargeJob = require('../../../../../src/modules/billing/bull-jobs/create-charge');
const batchService = require('../../../../../src/modules/billing/services/batch-service');

const sandbox = require('sinon').createSandbox();

experiment('modules/billing/bull-jobs/prepare-transactions/config.js', () => {
  let result, job;

  beforeEach(async () => {
    job = {
      data: {
        batch: {
          id: 'test-batch-id'
        }
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(createChargeJob, 'publish');

    sandbox.stub(batchService, 'setStatusToEmptyWhenNoTransactions');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has the correct queue name', () => {
    expect(jobConfig.jobName).to.equal('billing.prepare-transactions.*');
  });

  experiment('.createMessage', () => {
    beforeEach(async () => {
      result = jobConfig.createMessage(job.data);
    });

    test('formats the message', async () => {
      expect(result.data).to.equal(job.data);
      expect(result.options.jobId).to.equal('billing.prepare-transactions.test-batch-id');
    });
  });

  experiment('.onComplete', () => {
    experiment('when there are no transactions to process', () => {
      beforeEach(async () => {
        const jobResult = {
          transactions: [],
          batch: job.data.batch
        };
        await jobConfig.onComplete(job, jobResult);
      });

      test('the batch is set to empty status', async () => {
        expect(batchService.setStatusToEmptyWhenNoTransactions.calledWith(
          job.data.batch
        )).to.be.true();
      });

      test('no other jobs are published', async () => {
        expect(createChargeJob.publish.called).to.be.false();
      });
    });

    experiment('when there are transactions to process', () => {
      let jobResult;

      beforeEach(async () => {
        jobResult = {
          transactions: [{
            billingTransactionId: 'test-transaction-1'
          }, {
            billingTransactionId: 'test-transaction-2'
          }],
          batch: job.data.batch
        };
        await jobConfig.onComplete(job, jobResult);
      });

      test('the batch is not set to empty status', async () => {
        expect(batchService.setStatusToEmptyWhenNoTransactions.called).to.be.false();
      });

      test('a job is published for each transaction', async () => {
        expect(createChargeJob.publish.callCount).to.equal(2);
        const [firstTransaction] = createChargeJob.publish.firstCall.args;
        expect(firstTransaction.transaction).to.equal(jobResult.transactions[0]);
        const [secondTransaction] = createChargeJob.publish.secondCall.args;
        expect(secondTransaction.transaction).to.equal(jobResult.transactions[1]);
      });
    });
  });
});
