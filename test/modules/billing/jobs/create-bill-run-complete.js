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

const BATCH_ID = uuid();
const EVENT_ID = uuid();

experiment('modules/billing/jobs/create-bill-run-complete', () => {
  let messageQueue, job;

  beforeEach(async () => {
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

    sandbox.stub(batchJob, 'failBatch').resolves();
    sandbox.stub(batchJob, 'logOnComplete').resolves();
    sandbox.stub(batchJob, 'logOnCompleteError').resolves();

    messageQueue = {
      publish: sandbox.stub().resolves()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the batch is set to error and cancelled ', async () => {
      job.data.failed = true;
      await createBillRunComplete(job, messageQueue);

      const failArgs = batchJob.failBatch.lastCall.args;
      expect(failArgs[0]).to.equal(job);
      expect(failArgs[1]).to.equal(messageQueue);
      expect(failArgs[2]).to.equal(Batch.BATCH_ERROR_CODE.failedToCreateBillRun);
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
