'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../src/logger');
const jobService = require('../../../../src/modules/billing/services/job-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../../src/lib/models/batch');

const handlePrepareTransactionsComplete = require('../../../../src/modules/billing/jobs/prepare-transactions-complete');

experiment('modules/billing/jobs/prepare-transactions-complete', () => {
  let messageQueue;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'failBatch');
    sandbox.stub(jobService, 'setReadyJob');
    sandbox.stub(jobService, 'setEmptyBatch');

    messageQueue = {
      publish: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job has failed', () => {
    test('the batch is set to error and cancelled ', async () => {
      const job = {
        name: 'testing',
        data: {
          failed: true
        }
      };
      await handlePrepareTransactionsComplete(job, messageQueue);

      const failArgs = batchJob.failBatch.lastCall.args;
      expect(failArgs[0]).to.equal(job);
      expect(failArgs[1]).to.equal(messageQueue);
      expect(failArgs[2]).to.equal(BATCH_ERROR_CODE.failedToPrepareTransactions);
    });
  });

  experiment('when there are no transactions to create', () => {
    beforeEach(async () => {
      await handlePrepareTransactionsComplete({
        data: {
          response: {
            transactions: [],
            batch: {
              billing_batch_id: 'test-batch-id'
            }
          },
          request: {
            data: {
              eventId: 'test-event-id'
            }
          }
        }
      }, messageQueue);
    });

    test('the batch is set as empty', async () => {
      const [eventId, batchId] = jobService.setEmptyBatch.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(batchId).to.equal('test-batch-id');

      expect(jobService.setReadyJob.called).to.equal(false);
    });

    test('no further jobs are published', async () => {
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('when there are transactions to create charges for', () => {
    beforeEach(async () => {
      await handlePrepareTransactionsComplete({
        data: {
          response: {
            transactions: [
              { billing_transaction_id: 'test-transaction-id-1' },
              { billing_transaction_id: 'test-transaction-id-2' }
            ],
            batch: {
              billing_batch_id: 'test-batch-id'
            }
          },
          request: {
            data: {
              eventId: 'test-event-id'
            }
          }
        }
      }, messageQueue);
    });

    test('the batch is not completed', async () => {
      expect(jobService.setReadyJob.called).to.be.false();
    });

    test('publishes jobs for the transactions', async () => {
      const [message1] = messageQueue.publish.firstCall.args;
      const [message2] = messageQueue.publish.secondCall.args;

      expect(message1).to.equal({
        name: 'billing.create-charge.test-batch-id',
        data: {
          eventId: 'test-event-id',
          batch: {
            billing_batch_id: 'test-batch-id'
          },
          transaction: {
            billing_transaction_id: 'test-transaction-id-1'
          }
        },
        options: {
          singletonKey: 'billing.create-charge.test-transaction-id-1'
        }
      });

      expect(message2).to.equal({
        name: 'billing.create-charge.test-batch-id',
        data: {
          eventId: 'test-event-id',
          batch: {
            billing_batch_id: 'test-batch-id'
          },
          transaction: {
            billing_transaction_id: 'test-transaction-id-2'
          }
        },
        options: {
          singletonKey: 'billing.create-charge.test-transaction-id-2'
        }
      });
    });
  });
});
