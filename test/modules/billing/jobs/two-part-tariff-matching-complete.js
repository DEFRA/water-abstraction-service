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

const twoPartTariffMatchingComplete = require('../../../../src/modules/billing/jobs/two-part-tariff-matching-complete');

const batchService = require('../../../../src/modules/billing/services/batch-service');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_TYPE, BATCH_STATUS } = require('../../../../src/lib/models/batch');

const Batch = require('../../../../src/lib/models/batch');

const batchId = uuid();
const eventId = 'test-event-id';

const createJob = () => ({
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
});

experiment('modules/billing/jobs/two-part-tariff-matching-complete', () => {
  let messageQueue, batch, job;

  beforeEach(async () => {
    job = createJob();

    messageQueue = {
      publish: sandbox.stub(),
      deleteQueue: sandbox.stub()
    };

    batch = new Batch(batchId);
    batch.type = BATCH_TYPE.twoPartTariff;
    batch.status = BATCH_STATUS.processing;

    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'logOnCompleteError');

    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(batchService, 'setErrorStatus');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the other jobs in the queue are deleted', async () => {
      job.data.failed = true;
      await twoPartTariffMatchingComplete(job, messageQueue);
      expect(messageQueue.deleteQueue.calledWith(job.data.request.name)).to.be.true();
    });
  });

  experiment('when the batch is not in "processing" status', () => {
    test('no further jobs are scheduled', async () => {
      batch.status = Batch.BATCH_STATUS.error;
      await twoPartTariffMatchingComplete(job, messageQueue);
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('when the job did not fail', () => {
    experiment('when two-part tariff review is needed', async () => {
      beforeEach(async () => {
        job.data.response.isReviewNeeded = true;
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
        const [job] = messageQueue.publish.lastCall.args;

        expect(job.name).to.equal(`billing.process-charge-versions.${batchId}`);
        expect(job.data.batch).to.equal(batch);
        expect(job.data.eventId).to.equal(eventId);
        expect(job.options).to.equal({ singletonKey: batchId });
      });
    });
  });

  experiment('when there is an unexpected error', () => {
    const err = new Error('oh no!');
    let result;

    beforeEach(async () => {
      job.data.response.isReviewNeeded = false;
      messageQueue.publish.rejects(err);
      const func = () => twoPartTariffMatchingComplete(job, messageQueue);
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
