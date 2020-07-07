'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { logger } = require('../../../../../src/logger');
const jobConfig = require('../../../../../src/modules/billing/bull-jobs/create-charge/config');
const refreshTotalsJob = require('../../../../../src/modules/billing/bull-jobs/refresh-totals');
const batchService = require('../../../../../src/modules/billing/services/batch-service');

const sandbox = require('sinon').createSandbox();

experiment('modules/billing/bull-jobs/create-charge/config.js', () => {
  let result, job;

  beforeEach(async () => {
    job = {
      data: {
        batch: {
          id: 'test-batch-id'
        },
        transaction: {
          billingTransactionId: 'test-transaction-id'
        }
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(refreshTotalsJob, 'publish');

    sandbox.stub(batchService, 'getTransactionStatusCounts');
    sandbox.stub(batchService, 'cleanup');
    sandbox.stub(batchService, 'setStatusToEmptyWhenNoTransactions');
    sandbox.stub(batchService, 'setStatus');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has the correct queue name', () => {
    expect(jobConfig.jobName).to.equal('billing.create-charge.*');
  });

  experiment('.createMessage', () => {
    beforeEach(async () => {
      result = jobConfig.createMessage(job.data);
    });

    test('formats the message', async () => {
      expect(result.data).to.equal(job.data);
      expect(result.options.jobId).to.equal('billing.create-charge.test-batch-id.test-transaction-id');
    });
  });

  experiment('.onComplete', () => {
    experiment('when there are still candidate transactions to process', () => {
      beforeEach(async () => {
        batchService.getTransactionStatusCounts.resolves({
          candidate: 3
        });
        result = await jobConfig.onComplete(job);
      });

      test('logs a message', async () => {
        expect(logger.info.calledWith(
        `Handling onComplete: ${job.id}`
        )).to.be.true();
      });

      test('does not call other methods', async () => {
        expect(batchService.cleanup.called).to.be.false();
        expect(batchService.setStatusToEmptyWhenNoTransactions.called).to.be.false();
        expect(batchService.setStatus.called).to.be.false();
        expect(refreshTotalsJob.publish.called).to.be.false();
      });
    });

    experiment('when there are no candidate or created transactions', () => {
      beforeEach(async () => {
        batchService.getTransactionStatusCounts.resolves({
          candidate: 0,
          charge_created: 0
        });
        result = await jobConfig.onComplete(job);
      });

      test('logs a message', async () => {
        expect(logger.info.calledWith(
        `Handling onComplete: ${job.id}`
        )).to.be.true();
      });

      test('only calls cleanup and marks batch as empty', async () => {
        expect(batchService.cleanup.called).to.be.true();
        expect(batchService.setStatusToEmptyWhenNoTransactions.called).to.be.true();
        expect(batchService.setStatus.called).to.be.false();
        expect(refreshTotalsJob.publish.called).to.be.false();
      });
    });

    experiment('when there are no candidate transactions', () => {
      beforeEach(async () => {
        batchService.getTransactionStatusCounts.resolves({
          candidate: 0,
          charge_created: 3
        });
        result = await jobConfig.onComplete(job);
      });

      test('logs a message', async () => {
        expect(logger.info.calledWith(
        `Handling onComplete: ${job.id}`
        )).to.be.true();
      });

      test('cleans up batch', async () => {
        expect(batchService.cleanup.called).to.be.true();
      });

      test('does not mark batch as empty', async () => {
        expect(batchService.setStatusToEmptyWhenNoTransactions.called).to.be.false();
      });

      test('sets batch status to "ready"', async () => {
        expect(batchService.setStatus.calledWith(
          job.data.batch.id, 'ready'
        )).to.be.true();
      });

      test('publishes job to refresh batch totals', async () => {
        expect(refreshTotalsJob.publish.calledWith({
          batch: job.data.batch
        })).to.be.true();
      });
    });
  });
});
