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
const processChargeVersionsComplete = require('../../../../src/modules/billing/jobs/process-charge-versions-complete');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_ERROR_CODE, BATCH_TYPE } = require('../../../../src/lib/models/batch');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');

const Batch = require('../../../../src/lib/models/batch');

const batchId = 'test-batch-id';
const eventId = 'test-event-id';

experiment('modules/billing/jobs/process-charge-versions-complete', () => {
  let messageQueue, batch;

  beforeEach(async () => {
    messageQueue = {
      publish: sandbox.stub()
    };

    batch = new Batch('0310af58-bb31-45ec-9a8a-f4a8f8da8ee7');
    batch.type = BATCH_TYPE.twoPartTariff;

    sandbox.stub(chargeVersionYearService, 'getStatusCounts');
    sandbox.stub(batchJob, 'logOnCompleteError');
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'failBatch');
    sandbox.stub(batchJob, 'deleteOnCompleteQueue');
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
      await processChargeVersionsComplete(job, messageQueue);

      const failArgs = batchJob.failBatch.lastCall.args;
      expect(failArgs[0]).to.equal(job);
      expect(failArgs[1]).to.equal(messageQueue);
      expect(failArgs[2]).to.equal(BATCH_ERROR_CODE.failedToProcessChargeVersions);
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
          billingBatchChargeVersionYears: [{
            billingBatchChargeVersionYearId: 'test-id-1'
          }, {
            billingBatchChargeVersionYearId: 'test-id-2'
          }]
        }
      }
    };

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
