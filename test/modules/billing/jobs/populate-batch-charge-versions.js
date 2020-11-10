'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../src/logger');
const messageQueue = require('../../../../src/lib/message-queue');
const populateBatchChargeVersionsJob = require('../../../../src/modules/billing/jobs/populate-batch-charge-versions');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');

const batchService = require('../../../../src/modules/billing/services/batch-service');
const chargeVersionService = require('../../../../src/modules/billing/services/charge-version-service');

const Batch = require('../../../../src/lib/models/batch');
const Region = require('../../../../src/lib/models/region');

const uuid = require('uuid/v4');

const createBatch = () => {
  const batch = new Batch(uuid());
  batch.region = new Region(uuid());
  return batch;
};

const createBillingBatchChargeVersionYears = batch => [
  {
    billingBatchChargeVersionYearId: uuid(),
    billingBatchId: batch.id,
    chargeVersionId: uuid(),
    financialYearEnding: 2021
  },
  {
    billingBatchChargeVersionYearId: uuid(),
    billingBatchId: batch.id,
    chargeVersionId: uuid(),
    financialYearEnding: 2021
  }
];

experiment('modules/billing/jobs/populate-batch-charge-versions', () => {
  let batch, billingBatchChargeVersionYears;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');

    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingErrorAndSetBatchStatus');

    sandbox.stub(messageQueue, 'publish').resolves();

    batch = createBatch();
    billingBatchChargeVersionYears = createBillingBatchChargeVersionYears(batch);

    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(batchService, 'setErrorStatus');

    sandbox.stub(chargeVersionService, 'createForBatch').resolves(billingBatchChargeVersionYears);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(populateBatchChargeVersionsJob.jobName).to.equal('billing.populate-batch-charge-versions.*');
  });

  experiment('.createMessage', () => {
    test('creates the expected request object', async () => {
      const batch = { id: 'test-batch' };
      const message = populateBatchChargeVersionsJob.createMessage('test-event-id', batch);
      expect(message.name).to.equal('billing.populate-batch-charge-versions.test-batch');
      expect(message.data).to.equal({
        eventId: 'test-event-id',
        batch: {
          id: 'test-batch'
        }
      });
    });
  });

  experiment('.handler', () => {
    let result, job;

    beforeEach(async () => {
      job = {
        data: {
          eventId: '22222222-2222-2222-2222-222222222222',
          batch: {
            type: 'supplementary',
            id: batch.id
          }
        },
        done: sandbox.spy()
      };
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        result = await populateBatchChargeVersionsJob.handler(job);
      });

      test('fetches the correct batch from the batch service', async () => {
        expect(batchService.getBatchById.calledWith(
          batch.id
        )).to.be.true();
      });

      test('includes the batch in the job response', async () => {
        expect(result.batch).to.equal(batch);
      });

      test('includes the billingBatchChargeVersionYears in the job response', async () => {
        expect(result.billingBatchChargeVersionYears).to.equal(billingBatchChargeVersionYears);
      });
    });

    experiment('when there is an error', async () => {
      const error = new Error('oops!');
      let err;

      beforeEach(async () => {
        batchService.getBatchById.rejects(error);
        const func = () => populateBatchChargeVersionsJob.handler(job);
        err = await expect(func()).to.reject();
      });

      test('the error is logged and batch marked as error status', async () => {
        const { args } = batchJob.logHandlingErrorAndSetBatchStatus.lastCall;
        expect(args[0]).to.equal(job);
        expect(args[1] instanceof Error).to.be.true();
        expect(args[2]).to.equal(Batch.BATCH_ERROR_CODE.failedToPopulateChargeVersions);
      });

      test('re-throws the error', async () => {
        expect(error).to.equal(err);
      });
    });
  });
});
