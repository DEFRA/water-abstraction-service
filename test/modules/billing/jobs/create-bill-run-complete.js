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
const uuid = require('uuid/v4');

const createBillRunComplete = require('../../../../src/modules/billing/jobs/create-bill-run-complete');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const Batch = require('../../../../src/lib/models/batch');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const BATCH_ID = uuid();
const EVENT_ID = uuid();

experiment('modules/billing/jobs/create-bill-run-complete', () => {
  let messageQueue, job, batch;

  beforeEach(async () => {
    batch = new Batch(BATCH_ID);
    batch.status = Batch.BATCH_STATUS.processing;

    job = {
      data: {
        request: {
          name: 'billbilling.create-bill-run.test-id',
          data: {
            batch: {
              id: BATCH_ID
            },
            eventId: EVENT_ID
          }
        },
        response: {
          batch: {
            id: BATCH_ID
          },
          eventId: EVENT_ID
        }
      }
    };

    sandbox.stub(batchJob, 'logOnComplete').resolves();
    sandbox.stub(batchJob, 'logOnCompleteError').resolves();
    sandbox.stub(batchService, 'getBatchById').resolves(batch);

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
      await createBillRunComplete(job, messageQueue);
      expect(messageQueue.deleteQueue.calledWith(job.data.request.name)).to.be.true();
    });
  });

  experiment('when the batch is not in "processing" status', () => {
    test('no further jobs are scheduled', async () => {
      batch.status = Batch.BATCH_STATUS.error;
      await createBillRunComplete(job, messageQueue);
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('when the job succeeded', () => {
    beforeEach(async () => {
      await createBillRunComplete(job, messageQueue);
    });

    test('publish next job in sequence', async () => {
      const [message] = messageQueue.publish.lastCall.args;

      expect(message.name).to.equal(`billing.populate-batch-charge-versions.${BATCH_ID}`);
      expect(message.data.batch.id).to.equal(BATCH_ID);
      expect(message.data.eventId).to.equal(EVENT_ID);
    });
  });

  experiment('when publishing the next job fails', () => {
    beforeEach(async () => {
      messageQueue.publish.rejects();
    });

    test('a message is logged and rethrown', async () => {
      const func = () => createBillRunComplete(job, messageQueue);
      await expect(func()).to.reject();
      expect(batchJob.logOnCompleteError.calledWith(job)).to.be.true();
    });
  });
});
