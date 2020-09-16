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
const processChargeVersionComplete = require('../../../../src/modules/billing/jobs/process-charge-version-complete');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_STATUS, BATCH_TYPE } = require('../../../../src/lib/models/batch');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const billingVolumeService = require('../../../../src/modules/billing/services/billing-volumes-service');

const Batch = require('../../../../src/lib/models/batch');

const batchId = uuid();
const eventId = 'test-event-id';

const createJob = () => ({
  data: {
    failed: false,
    request: {
      data: {
        eventId
      }
    },
    response: {
      chargeVersionYear: {
        billingBatchId: batchId
      }
    }
  }
});

experiment('modules/billing/jobs/process-charge-version-complete', () => {
  let messageQueue, batch, job;

  beforeEach(async () => {
    job = createJob();

    messageQueue = {
      publish: sandbox.spy(),
      deleteQueue: sandbox.spy()
    };

    batch = new Batch(batchId);
    batch.type = BATCH_TYPE.twoPartTariff;
    batch.status = BATCH_STATUS.processing;

    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(batchService, 'setStatus').resolves({});
    sandbox.stub(billingVolumeService, 'getUnapprovedVolumesForBatchCount');

    sandbox.stub(chargeVersionYearService, 'getStatusCounts');
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'deleteOnCompleteQueue');
    sandbox.stub(logger, 'info');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the other jobs in the queue are deleted', async () => {
      job.data.failed = true;
      await processChargeVersionComplete(job, messageQueue);
      expect(messageQueue.deleteQueue.calledWith(job.data.request.name)).to.be.true();
    });
  });

  experiment('when the batch is not in "processing" status', () => {
    test('no further jobs are scheduled', async () => {
      batch.status = Batch.BATCH_STATUS.error;
      await processChargeVersionComplete(job, messageQueue);
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('if there are more charge version years to process', () => {
    beforeEach(async () => {
      chargeVersionYearService.getStatusCounts.resolves({
        processing: 2
      });

      await processChargeVersionComplete(job, messageQueue);

      test('.findProcessingByBatch() is called with the batch ID', async () => {
        expect(
          chargeVersionYearService.getStatusCounts.calledWith(batchId)
        ).to.be.true();
      });

      test('the prepare-transactions job is not published', async () => {
        expect(messageQueue.publish.called).to.be.false();
      });

      test('remaining onComplete jobs are not deleted', async () => {
        expect(batchJob.deleteOnCompleteQueue.called).to.be.false();
      });
    });

    experiment('for a batch with unapproved billing volumes', () => {
      beforeEach(async () => {
        chargeVersionYearService.getStatusCounts.resolves({
          processing: 0
        });
        billingVolumeService.getUnapprovedVolumesForBatchCount.resolves(5);

        await processChargeVersionComplete(job, messageQueue);
      });

      test('sets the batch status to "review"', async () => {
        expect(batchService.setStatus.calledWith(
          batchId, BATCH_STATUS.review
        )).to.be.true();
      });

      test('the prepare-transactions job is not published', async () => {
        expect(messageQueue.publish.called).to.be.false();
      });
    });

    experiment('for a batch with no unapproved billing volumes', () => {
      beforeEach(async () => {
        chargeVersionYearService.getStatusCounts.resolves({
          processing: 0
        });
        billingVolumeService.getUnapprovedVolumesForBatchCount.resolves(0);

        await processChargeVersionComplete(job, messageQueue);
      });

      test('does not set the batch status to "review"', async () => {
        expect(batchService.setStatus.calledWith(
          batch.id, BATCH_STATUS.review
        )).to.be.false();
      });

      test('publishes the prepare-transactions job', async () => {
        expect(messageQueue.publish.called).to.be.true();
      });
    });

    experiment('if all the charge version years have been processed', () => {
      beforeEach(async () => {
        batch.type = BATCH_TYPE.supplementary;
        batchService.getBatchById.resolves(batch);

        chargeVersionYearService.getStatusCounts.resolves({
          processing: 0
        });

        await processChargeVersionComplete(job, messageQueue);
      });

      test('.findProcessingByBatch() is called with the batch ID', async () => {
        expect(
          chargeVersionYearService.getStatusCounts.calledWith(batchId)
        ).to.be.true();
      });

      test('the prepare-transactions job is published', async () => {
        const [message] = messageQueue.publish.lastCall.args;
        expect(message.name).to.equal(`billing.prepare-transactions.${batchId}`);
      });

      test('the job is published including the eventId', async () => {
        const [message] = messageQueue.publish.lastCall.args;
        expect(message.data.eventId).to.equal('test-event-id');
      });

      test('the job is published including the batch object', async () => {
        const [message] = messageQueue.publish.lastCall.args;
        expect(message.data.batch.id).to.equal(batch.id);
      });

      test('remaining onComplete jobs are deleted', async () => {
        expect(batchJob.deleteOnCompleteQueue.calledWith(
          job, messageQueue
        )).to.be.true();
      });
    });
  });
});
