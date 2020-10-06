'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const createChargeComplete = require('../../../../src/modules/billing/jobs/create-charge-complete');
const jobService = require('../../../../src/modules/billing/services/job-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const Batch = require('../../../../src/lib/models/batch');

const BATCH_ID = uuid();
const EVENT_ID = uuid();

experiment('modules/billing/jobs/create-charge-complete', () => {
  let messageQueue, job, batch;

  beforeEach(async () => {
    batch = new Batch(BATCH_ID);
    batch.status = Batch.BATCH_STATUS.processing;

    job = {
      data: {
        request: {
          data: {
            eventId: EVENT_ID
          }
        },
        response: {
          batch: {
            id: BATCH_ID
          }
        }
      }
    };

    sandbox.stub(jobService, 'setReadyJob').resolves();
    sandbox.stub(jobService, 'setEmptyBatch').resolves();

    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(batchService, 'getTransactionStatusCounts').resolves({});
    sandbox.stub(batchService, 'setErrorStatus').resolves();
    sandbox.stub(batchService, 'cleanup').resolves();

    sandbox.stub(batchJob, 'logOnComplete').resolves();
    sandbox.stub(batchJob, 'logOnCompleteError').resolves();
    sandbox.stub(batchJob, 'deleteOnCompleteQueue').resolves();

    messageQueue = {
      publish: sandbox.stub().resolves(),
      deleteQueue: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the other jobs in the queue are deleted', async () => {
      job.data.failed = true;
      await createChargeComplete(job, messageQueue);
      expect(messageQueue.deleteQueue.calledWith(job.data.request.name)).to.be.true();
    });
  });

  experiment('when the batch is not in "processing" status', () => {
    test('no further jobs are scheduled', async () => {
      batch.status = Batch.BATCH_STATUS.error;
      await createChargeComplete(job, messageQueue);
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('when there are still candidate transactions to process', () => {
    beforeEach(async () => {
      batchService.getTransactionStatusCounts.resolves({
        candidate: 3
      });
      await createChargeComplete(job, messageQueue);
    });

    test('no further jobs are published', async () => {
      expect(messageQueue.publish.called).to.be.false();
    });

    test('the job is not marked as ready', async () => {
      expect(jobService.setReadyJob.called).to.be.false();
    });

    test('the batch cleanup is not called', async () => {
      expect(batchService.cleanup.called).to.be.false();
    });

    test('remaining onComplete jobs are not deleted', async () => {
      expect(batchJob.deleteOnCompleteQueue.called).to.be.false();
    });
  });

  experiment('when there are errored transactions in the batch', () => {
    beforeEach(async () => {
      batchService.getTransactionStatusCounts.resolves({
        candidate: 3,
        error: 1
      });
      await createChargeComplete(job, messageQueue);
    });

    test('no further jobs are published', async () => {
      expect(messageQueue.publish.called).to.be.false();
    });

    test('the job is not marked as ready', async () => {
      expect(jobService.setReadyJob.called).to.be.false();
    });

    test('the batch cleanup is not called', async () => {
      expect(batchService.cleanup.called).to.be.false();
    });

    test('remaining onComplete jobs are not deleted', async () => {
      expect(batchJob.deleteOnCompleteQueue.called).to.be.false();
    });
  });

  experiment('when a non-empty batch is processed', () => {
    beforeEach(async () => {
      batchService.getTransactionStatusCounts.resolves({
        processing: 0,
        charge_created: 2
      });
      await createChargeComplete(job, messageQueue);
    });

    test('the batch cleanup is called', async () => {
      expect(batchService.cleanup.called).to.be.true();
    });

    test('a job is published to get Charge Module totals', async () => {
      const { data } = messageQueue.publish.lastCall.args[0];
      expect(data.batchId).to.equal(BATCH_ID);
    });

    test('remaining onComplete jobs are deleted', async () => {
      expect(batchJob.deleteOnCompleteQueue.calledWith(
        job, messageQueue
      )).to.be.true();
    });
  });

  experiment('when an empty batch is processed', () => {
    beforeEach(async () => {
      batchService.getTransactionStatusCounts.resolves({
        processing: 0,
        charge_created: 0
      });
      await createChargeComplete(job, messageQueue);
    });

    test('the batch cleanup is called', async () => {
      expect(batchService.cleanup.called).to.be.true();
    });

    test('no further jobs are published', async () => {
      expect(messageQueue.publish.called).to.be.false();
    });

    test('the job is marked as empty', async () => {
      expect(jobService.setEmptyBatch.calledWith(
        EVENT_ID, BATCH_ID
      )).to.be.true();
    });

    test('remaining onComplete jobs are deleted', async () => {
      expect(batchJob.deleteOnCompleteQueue.calledWith(
        job, messageQueue
      )).to.be.true();
    });
  });

  experiment('when an error occurs', () => {
    beforeEach(async () => {
      batchService.getTransactionStatusCounts.rejects();

      try {
        await createChargeComplete(job, messageQueue);
        fail();
      } catch (err) {

      }
    });

    test('a message is logged', async () => {
      const args = batchJob.logOnCompleteError.lastCall.args;
      expect(args[0]).to.equal(job);
    });
  });
});
