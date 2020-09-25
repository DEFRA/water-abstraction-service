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

const { logger } = require('../../../../src/logger');
const jobService = require('../../../../src/modules/billing/services/job-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const Batch = require('../../../../src/lib/models/batch');

const handlePrepareTransactionsComplete = require('../../../../src/modules/billing/jobs/prepare-transactions-complete');

const BATCH_ID = uuid();

const createJob = () => ({
  data: {
    response: {
      transactions: [],
      batch: {
        id: 'test-batch-id'
      }
    },
    request: {
      data: {
        eventId: 'test-event-id'
      }
    }
  }
});

experiment('modules/billing/jobs/prepare-transactions-complete', () => {
  let messageQueue, job, batch;

  beforeEach(async () => {
    batch = new Batch(BATCH_ID);
    batch.status = Batch.BATCH_STATUS.processing;

    job = createJob();

    sandbox.stub(logger, 'info');
    sandbox.stub(batchJob, 'logOnCompleteError');
    sandbox.stub(jobService, 'setReadyJob');
    sandbox.stub(jobService, 'setEmptyBatch');

    sandbox.stub(batchService, 'getBatchById').resolves(batch);

    messageQueue = {
      publish: sandbox.spy(),
      deleteQueue: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the other jobs in the queue are deleted', async () => {
      job.data.failed = true;
      await handlePrepareTransactionsComplete(job, messageQueue);
      expect(messageQueue.deleteQueue.calledWith(job.data.request.name)).to.be.true();
    });
  });

  experiment('when the batch is not in "processing" status', () => {
    test('no further jobs are scheduled', async () => {
      batch.status = Batch.BATCH_STATUS.error;
      await handlePrepareTransactionsComplete(job, messageQueue);
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('when there are no transactions to create', () => {
    beforeEach(async () => {
      await handlePrepareTransactionsComplete(job, messageQueue);
    });

    test('the batch is set as empty', async () => {
      const [eventId, batchId] = jobService.setEmptyBatch.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(batchId).to.equal(BATCH_ID);

      expect(jobService.setReadyJob.called).to.equal(false);
    });

    test('no further jobs are published', async () => {
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('when there are transactions to create charges for', () => {
    beforeEach(async () => {
      job.data.response.transactions = [
        { billing_transaction_id: 'test-transaction-id-1' },
        { billing_transaction_id: 'test-transaction-id-2' }
      ];
      await handlePrepareTransactionsComplete(job, messageQueue);
    });

    test('the batch is not completed', async () => {
      expect(jobService.setReadyJob.called).to.be.false();
    });

    test('publishes jobs for the transactions', async () => {
      const [message1] = messageQueue.publish.firstCall.args;
      const [message2] = messageQueue.publish.secondCall.args;

      expect(message1.name).to.equal(`billing.create-charge.${BATCH_ID}`);
      expect(message1.data.eventId).to.equal('test-event-id');
      expect(message1.data.batch.id).to.equal(BATCH_ID);
      expect(message1.data.transaction).to.equal({
        billing_transaction_id: 'test-transaction-id-1'
      });
      expect(message1.options).to.equal({ singletonKey: 'test-transaction-id-1' });

      expect(message2.name).to.equal(`billing.create-charge.${BATCH_ID}`);
      expect(message2.data.eventId).to.equal('test-event-id');
      expect(message2.data.batch.id).to.equal(BATCH_ID);
      expect(message2.data.transaction).to.equal({
        billing_transaction_id: 'test-transaction-id-2'
      });
      expect(message2.options).to.equal({ singletonKey: 'test-transaction-id-2' });
    });
  });

  experiment('when there is an unexpected error', () => {
    const err = new Error('oh no!');
    let result;

    beforeEach(async () => {
      jobService.setEmptyBatch.rejects(err);
      const func = () => handlePrepareTransactionsComplete(job, messageQueue);
      result = await expect(func()).to.reject();
    });

    test('the error is logged and rethrown', async () => {
      expect(batchJob.logOnCompleteError.calledWith(
        job, err
      )).to.be.true();
      expect(result).to.equal(err);
    });
  });
});
