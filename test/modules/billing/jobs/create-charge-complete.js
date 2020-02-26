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

const { logger } = require('../../../../src/logger');
const createChargeComplete = require('../../../../src/modules/billing/jobs/create-charge-complete');
const jobService = require('../../../../src/modules/billing/services/job-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const Batch = require('../../../../src/lib/models/batch');

const BATCH_ID = uuid();
const EVENT_ID = uuid();

experiment('modules/billing/jobs/create-charge-complete', () => {
  let messageQueue, job;
  const batch = new Batch(BATCH_ID);

  beforeEach(async () => {
    job = {
      data: {
        request: {
          data: {
            eventId: EVENT_ID
          }
        },
        response: {
          batch: {
            billing_batch_id: BATCH_ID
          }
        }
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');

    sandbox.stub(jobService, 'setReadyJob').resolves();
    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(batchService, 'getTransactionStatusCounts').resolves({});
    sandbox.stub(batchService, 'setErrorStatus').resolves();

    messageQueue = {
      publish: sandbox.stub().resolves()
    };
  });

  afterEach(async () => {
    sandbox.restore();
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
  });

  experiment('when there are no candidate transactions to process', () => {
    beforeEach(async () => {
      batchService.getTransactionStatusCounts.resolves({
      });
      await createChargeComplete(job, messageQueue);
    });

    test('a job is published to get Charge Module totals', async () => {
      const { data } = messageQueue.publish.lastCall.args[0];
      expect(data.eventId).to.equal(EVENT_ID);
      expect(data.batch).to.equal(job.data.response.batch);
    });

    test('the job is marked as ready', async () => {
      expect(jobService.setReadyJob.calledWith(
        EVENT_ID, BATCH_ID
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
      const [msg, , params] = logger.error.lastCall.args;
      expect(msg).to.be.a.string();
      expect(params.batchId).to.equal(BATCH_ID);
    });

    test('the batch is set to error status', async () => {
      const [batchId] = batchService.setErrorStatus.lastCall.args;
      expect(batchId).to.equal(BATCH_ID);
    });
  });
});
