const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const twoPartTariffMatchingComplete = require('../../../../src/modules/billing/jobs/two-part-tariff-matching-complete');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_ERROR_CODE, BATCH_TYPE } = require('../../../../src/lib/models/batch');

const Batch = require('../../../../src/lib/models/batch');

const batchId = 'test-batch-id';
const eventId = 'test-event-id';

experiment('modules/billing/jobs/two-part-tariff-matching-complete', () => {
  let messageQueue, batch;

  beforeEach(async () => {
    messageQueue = {
      publish: sandbox.stub()
    };

    batch = new Batch('0310af58-bb31-45ec-9a8a-f4a8f8da8ee7');
    batch.type = BATCH_TYPE.twoPartTariff;

    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'failBatch');
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
      await twoPartTariffMatchingComplete(job, messageQueue);

      const failArgs = batchJob.failBatch.lastCall.args;
      expect(failArgs[0]).to.equal(job);
      expect(failArgs[1]).to.equal(messageQueue);
      expect(failArgs[2]).to.equal(BATCH_ERROR_CODE.failedToProcessTwoPartTariff);
    });
  });

  experiment('when the job did not fail', () => {
    const job = {
      name: 'testing',
      data: {
        failed: false,
        request: {
          data: {
            batch: {
              id: batchId
            },
            eventId
          }
        },
        response: {
          isReviewNeeded: true
        }
      }
    };

    experiment('when two-part tariff review is needed', async () => {
      beforeEach(async () => {
        await twoPartTariffMatchingComplete(job, messageQueue);
      });

      test('no further jobs are published', async () => {
        expect(messageQueue.publish.callCount).to.equal(0);
      });
    });

    experiment('when two-part tariff review is not needed', async () => {
      beforeEach(async () => {
        job.data.response.isReviewNeeded = false;
        await twoPartTariffMatchingComplete(job, messageQueue);
      });

      test('the processChargeVersions job is published', async () => {
        expect(messageQueue.publish.callCount).to.equal(1);
        const [message] = messageQueue.publish.lastCall.args;
        expect(message).to.equal({
          name: 'billing.process-charge-versions.test-batch-id',
          data: { batch: { id: 'test-batch-id' }, eventId: 'test-event-id' },
          options: { singletonKey: 'test-batch-id' }
        });
      });
    });
  });
});
