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

const repos = require('../../../../src/lib/connectors/repository');
const newRepos = require('../../../../src/lib/connectors/repos');

const jobService = require('../../../../src/modules/billing/services/job-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../../src/lib/models/batch');

const handlePopulateBatchChargeVersionsComplete = require('../../../../src/modules/billing/jobs/populate-batch-charge-versions-complete');

const createJob = (failed = false) => ({
  data: {
    failed,
    response: {
      billingBatchChargeVersionYears: [
        { billingBatchChargeVersionYearId: 'valid-1' },
        { billingBatchChargeVersionYearId: 'valid-2' }
      ],
      batch: {
        id: 'test-batch-id',
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
  let messageQueue, job;

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'logOnCompleteError');
    sandbox.stub(batchJob, 'failBatch');

    sandbox.stub(jobService, 'setEmptyBatch');

    sandbox.stub(newRepos.chargeVersions, 'findOne');
    sandbox.stub(repos.billingBatchChargeVersionYears, 'create');

    messageQueue = {
      publish: sandbox.stub()
    };

    job = createJob();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the batch is set to error and cancelled ', async () => {
      job = createJob(true);
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);

      const failArgs = batchJob.failBatch.lastCall.args;
      expect(failArgs[0]).to.equal(job);
      expect(failArgs[1]).to.equal(messageQueue);
      expect(failArgs[2]).to.equal(BATCH_ERROR_CODE.failedToPopulateChargeVersions);
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
      expect(batchId).to.equal('test-batch-id');
    });
  });

  experiment('when there are chargeVersion years, and the batch is annual', async () => {
    beforeEach(async () => {
      job.data.response.batch.type = 'annual';
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
    });

    test('the processChargeVersions job is published', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.name).to.equal('billing.process-charge-versions.test-batch-id');
    });
  });

  experiment('when there are chargeVersion years, and the batch is two-part tariff', async () => {
    beforeEach(async () => {
      job.data.response.batch.type = 'two_part_tariff';
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
    });

    test('the twoPartTariffMatching job is published', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.name).to.equal('billing.two-part-tariff-matching.test-batch-id');
    });
  });

  experiment('when there are chargeVersion years, and the batch is supplementary', async () => {
    beforeEach(async () => {
      job.data.response.batch.type = 'supplementary';
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);
    });

    test('the twoPartTariffMatching job is published', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.name).to.equal('billing.two-part-tariff-matching.test-batch-id');
    });
  });

  experiment('when there is an error publishing a job', () => {
    const err = new Error('oops!');

    beforeEach(async () => {
      messageQueue.publish.throws(err);
    });

    test('the batch is marked as error', async () => {
      const func = () => handlePopulateBatchChargeVersionsComplete(job, messageQueue);
      const error = await expect(func()).to.reject();
      expect(batchJob.logOnCompleteError.calledWith(
        job, err
      )).to.be.true();

      expect(error).to.equal(err);
    });
  });
});
