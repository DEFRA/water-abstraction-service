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

const repos = require('../../../../src/lib/connectors/repository');
const newRepos = require('../../../../src/lib/connectors/repos');

const jobService = require('../../../../src/modules/billing/services/job-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const Batch = require('../../../../src/lib/models/batch');

const handlePopulateBatchChargeVersionsComplete = require('../../../../src/modules/billing/jobs/populate-batch-charge-versions-complete');

const BATCH_ID = uuid();

const createJob = (failed = false) => ({
  data: {
    failed,
    response: {
      billingBatchChargeVersionYears: [
        { billingBatchChargeVersionYearId: 'valid-1' },
        { billingBatchChargeVersionYearId: 'valid-2' }
      ],
      batch: {
        id: BATCH_ID,
        startYear: {
          yearEnding: 2019
        },
        endYear: {
          yearEnding: 2019
        }
      }
    },
    request: {
      data: {
        eventId: 'test-event-id'
      }
    }
  }
});

experiment('modules/billing/jobs/populate-batch-charge-versions-complete', () => {
  let messageQueue, job, batch;

  beforeEach(async () => {
    batch = new Batch(BATCH_ID);
    batch.status = Batch.BATCH_STATUS.processing;

    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'logOnCompleteError');

    sandbox.stub(jobService, 'setEmptyBatch');

    sandbox.stub(batchService, 'getBatchById').resolves(batch);

    sandbox.stub(newRepos.chargeVersions, 'findOne');
    sandbox.stub(repos.billingBatchChargeVersionYears, 'create');

    messageQueue = {
      publish: sandbox.stub(),
      deleteQueue: sandbox.stub()
    };

    job = createJob();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the other jobs in the queue are deleted', async () => {
      job.data.failed = true;
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
      expect(messageQueue.deleteQueue.calledWith(job.data.request.name)).to.be.true();
    });
  });

  experiment('when the batch is not in "processing" status', () => {
    test('no further jobs are scheduled', async () => {
      batch.status = Batch.BATCH_STATUS.error;
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('when there are no chargeVersion years', () => {
    beforeEach(async () => {
      job.data.response.billingBatchChargeVersionYears = [];
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
    });

    test('no jobs are queued', async () => {
      expect(messageQueue.publish.called).to.be.false();
    });

    test('the batch is set to empty', async () => {
      const [eventId, batchId] = jobService.setEmptyBatch.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(batchId).to.equal(BATCH_ID);
    });
  });

  experiment('when there are chargeVersion years, and the batch is annual', async () => {
    beforeEach(async () => {
      batch.type = Batch.BATCH_TYPE.annual;
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
    });

    test('the processChargeVersions job is published', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.name).to.equal(`billing.process-charge-versions.${BATCH_ID}`);
    });
  });

  experiment('when there are chargeVersion years, and the batch is two-part tariff', async () => {
    beforeEach(async () => {
      job.data.response.batch.type = 'two_part_tariff';
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
    });

    test('the twoPartTariffMatching job is published', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.name).to.equal(`billing.two-part-tariff-matching.${BATCH_ID}`);
    });
  });

  experiment('when there are chargeVersion years, and the batch is supplementary', async () => {
    beforeEach(async () => {
      job.data.response.batch.type = 'supplementary';
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
    });

    test('the twoPartTariffMatching job is published', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.name).to.equal(`billing.two-part-tariff-matching.${BATCH_ID}`);
    });
  });

  experiment('when there is an error publishing a job', () => {
    const err = new Error('oops!');

    beforeEach(async () => {
      messageQueue.publish.throws(err);
    });

    test('the error is logged', async () => {
      const func = () => handlePopulateBatchChargeVersionsComplete(job, messageQueue);
      const error = await expect(func()).to.reject();
      expect(batchJob.logOnCompleteError.calledWith(
        job, err
      )).to.be.true();

      expect(error).to.equal(err);
    });
  });
});
