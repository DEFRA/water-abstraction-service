'use strict';

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
const jobService = require('../../../../src/modules/billing/services/job-service');

const handlePrepareTransactionsComplete = require('../../../../src/modules/billing/jobs/prepare-transactions-complete');

experiment('modules/billing/jobs/prepare-transactions-complete', () => {
  let messageQueue;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(jobService, 'setCompletedJob');

    messageQueue = {
      publish: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
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

    test('the batch is completed', async () => {
      const [eventId, batchId] = jobService.setCompletedJob.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(batchId).to.equal('test-batch-id');
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
      expect(jobService.setCompletedJob.called).to.be.false();
    });

    test('publishes jobs for the transactions', async () => {
      const [message1] = messageQueue.publish.firstCall.args;
      const [message2] = messageQueue.publish.secondCall.args;

      expect(message1).to.equal({
        name: 'billing.create-charge',
        data: {
          eventId: 'test-event-id',
          batch: {
            billing_batch_id: 'test-batch-id'
          },
          transaction: {
            billing_transaction_id: 'test-transaction-id-1'
          }
        }
      });

      expect(message2).to.equal({
        name: 'billing.create-charge',
        data: {
          eventId: 'test-event-id',
          batch: {
            billing_batch_id: 'test-batch-id'
          },
          transaction: {
            billing_transaction_id: 'test-transaction-id-2'
          }
        }
      });
    });
  });
});
