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

const processChargeVersionsJob = require('../../../../src/modules/billing/jobs/process-charge-versions');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const Batch = require('../../../../src/lib/models/batch');

const batchId = uuid();
const eventId = 'test-event-id';

const billingBatchChargeVersionYears = [{
  chargeVersionYearId: 'test-charge-version-year-1'
}, {
  chargeVersionYearId: 'test-charge-version-year-2'
}];

experiment('modules/billing/jobs/process-charge-versions', () => {
  let batch;

  beforeEach(async () => {
    batch = new Batch(batchId);

    sandbox.stub(batchService, 'getBatchById').resolves(batch);

    sandbox.stub(chargeVersionYearService, 'getForBatch').resolves(billingBatchChargeVersionYears);

    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingError');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createMessage', () => {
    let message;
    beforeEach(async () => {
      message = processChargeVersionsJob.createMessage(eventId, batch);
    });

    test('creates the PG boss message', async () => {
      expect(message.data.batch).to.equal(batch);
      expect(message.data.eventId).to.equal(eventId);
      expect(message.name).to.equal(`billing.process-charge-versions.${batchId}`);
      expect(message.options.singletonKey).to.equal(batchId);
    });
  });

  experiment('.handler', () => {
    let result, message;

    experiment('when the batch status is "processing"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.processing;
        message = {
          data: {
            eventId,
            batch
          }
        };
        result = await processChargeVersionsJob.handler(message);
      });

      test('the batch is loaded', async () => {
        expect(batchService.getBatchById.calledWith(batchId)).to.be.true();
      });

      test('the charge version years are loaded for the batch', async () => {
        expect(chargeVersionYearService.getForBatch.calledWith(
          batchId
        )).to.be.true();
      });

      test('the handler returns the batch and billingBatchChargeVersionYears', async () => {
        expect(result.batch).to.equal(batch);
        expect(result.billingBatchChargeVersionYears).to.equal(billingBatchChargeVersionYears);
      });
    });

    experiment('when the batch status is not "processing"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.ready;
        message = {
          data: {
            eventId,
            batch
          }
        };
      });

      test('an error is logged and rethrown', async () => {
        const func = () => processChargeVersionsJob.handler(message);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Expected processing batch status');
        expect(batchJob.logHandlingError.calledWith(message, err)).to.be.true();
      });
    });

    experiment('when there is an unexpected error', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.processing;
        message = {
          data: {
            eventId,
            batch
          }
        };
        batchService.getBatchById.rejects(new Error('oops!'));
      });

      test('an error is logged and rethrown', async () => {
        const func = () => processChargeVersionsJob.handler(message);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('oops!');
        expect(batchJob.logHandlingError.calledWith(message, err)).to.be.true();
      });
    });
  });
});
