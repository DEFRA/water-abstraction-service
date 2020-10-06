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

const { logger } = require('../../../../src/logger');
const processChargeVersionsComplete = require('../../../../src/modules/billing/jobs/process-charge-versions-complete');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_TYPE, BATCH_STATUS } = require('../../../../src/lib/models/batch');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const Batch = require('../../../../src/lib/models/batch');

const batchId = uuid();
const eventId = 'test-event-id';

const createJob = () => ({
  name: 'test-name',
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
      billingBatchChargeVersionYears: [{
        billingBatchChargeVersionYearId: 'test-id-1'
      }, {
        billingBatchChargeVersionYearId: 'test-id-2'
      }]
    }
  }
});

experiment('modules/billing/jobs/process-charge-versions-complete', () => {
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

    sandbox.stub(chargeVersionYearService, 'getStatusCounts');
    sandbox.stub(batchJob, 'logOnCompleteError');
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'deleteOnCompleteQueue');
    sandbox.stub(logger, 'info');
    sandbox.stub(batchService, 'getBatchById').resolves(batch);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the other jobs in the queue are deleted', async () => {
      job.data.failed = true;
      await processChargeVersionsComplete(job, messageQueue);
      expect(messageQueue.deleteQueue.calledWith(job.data.request.name)).to.be.true();
    });
  });

  experiment('when the batch is not in "processing" status', () => {
    test('no further jobs are scheduled', async () => {
      batch.status = Batch.BATCH_STATUS.error;
      await processChargeVersionsComplete(job, messageQueue);
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('when the job did not fail', () => {
    experiment('when there are no errors publishing a message', async () => {
      beforeEach(async () => {
        await processChargeVersionsComplete(job, messageQueue);
      });

      test('a job is published to process each charge version year', async () => {
        expect(messageQueue.publish.callCount).to.equal(2);
        expect(messageQueue.publish.firstCall.args[0].data.chargeVersionYear.billingBatchChargeVersionYearId).to.equal('test-id-1');
        expect(messageQueue.publish.secondCall.args[0].data.chargeVersionYear.billingBatchChargeVersionYearId).to.equal('test-id-2');
      });
    });

    experiment('when there are errors publishing a message', async () => {
      beforeEach(async () => {
        messageQueue.publish.rejects(new Error('oops!'));
      });

      test('the error is logged and rethrown', async () => {
        const func = () => processChargeVersionsComplete(job, messageQueue);
        const err = await expect(func()).to.reject();
        expect(batchJob.logOnCompleteError.calledWith(job, err)).to.be.true();
        expect(err.message).to.equal('oops!');
      });
    });
  });
});
