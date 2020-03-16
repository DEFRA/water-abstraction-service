const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { logger } = require('../../../../src/logger');
const processChargeVersionComplete = require('../../../../src/modules/billing/jobs/process-charge-version-complete');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../../src/lib/models/batch');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');

const batchId = 'test-batch-id';

experiment('modules/billing/jobs/process-charge-version-complete', () => {
  let messageQueue;

  beforeEach(async () => {
    messageQueue = {
      publish: sandbox.spy()
    };
    sandbox.stub(chargeVersionYearService, 'getStatusCounts');
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'failBatch');
    sandbox.stub(logger, 'info');
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
      await processChargeVersionComplete(job, messageQueue);

      const failArgs = batchJob.failBatch.lastCall.args;
      expect(failArgs[0]).to.equal(job);
      expect(failArgs[1]).to.equal(messageQueue);
      expect(failArgs[2]).to.equal(BATCH_ERROR_CODE.failedToProcessChargeVersions);
    });
  });

  experiment('if there are more charge version years to process', () => {
    beforeEach(async () => {
      chargeVersionYearService.getStatusCounts.resolves({
        processing: 2
      });

      await processChargeVersionComplete({
        data: {
          request: {
            data: {
              eventId: 'test-event-id'
            }
          },
          response: {
            chargeVersionYear: {
              billing_batch_id: batchId
            }
          }
        }
      });
    });

    test('.findProcessingByBatch() is called with the batch ID', async () => {
      expect(
        chargeVersionYearService.getStatusCounts.calledWith(batchId)
      ).to.be.true();
    });

    test('the prepare-transactions job is not published', async () => {
      expect(messageQueue.publish.called).to.be.false();
    });
  });

  experiment('if all the charge version years have been processed', () => {
    beforeEach(async () => {
      chargeVersionYearService.getStatusCounts.resolves({
        processing: 0
      });

      const job = {
        data: {
          request: {
            data: {
              eventId: 'test-event-id'
            }
          },
          response: {
            chargeVersionYear: {
              billing_batch_id: batchId
            },
            batch: {
              billing_batch_id: batchId
            }
          }
        }
      };

      await processChargeVersionComplete(job, messageQueue);
    });

    test('.findProcessingByBatch() is called with the batch ID', async () => {
      expect(
        chargeVersionYearService.getStatusCounts.calledWith(batchId)
      ).to.be.true();
    });

    test('the prepare-transactions job is published', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.name).to.equal('billing.prepare-transactions.test-batch-id');
    });

    test('the job is published including the eventId', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.data.eventId).to.equal('test-event-id');
    });

    test('the job is published including the batch object', async () => {
      const [message] = messageQueue.publish.lastCall.args;
      expect(message.data.batch).to.equal({
        billing_batch_id: 'test-batch-id'
      });
    });
  });
});
