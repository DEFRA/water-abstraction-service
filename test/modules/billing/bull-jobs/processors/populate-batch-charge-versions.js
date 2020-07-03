'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const { logger } = require('../../../../../src/logger');
const Batch = require('../../../../../src/lib/models/batch');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const chargeVersionService = require('../../../../../src/modules/billing/services/charge-version-service');
const chargeVersionYearService = require('../../../../../src/modules/billing/services/charge-version-year');

const populateBatchChargeVersionsProcessor = require('../../../../../src/modules/billing/bull-jobs/processors/populate-batch-charge-versions');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('modules/billing/bull-jobs/processors/populate-batch-charge-versions', () => {
  let batch, job, batchId, result;

  beforeEach(async () => {
    batchId = uuid();
    batch = new Batch(batchId);

    job = {
      id: 'test-job-id',
      data: {
        batch: {
          id: batchId
        }
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(chargeVersionService, 'createForBatch');
    sandbox.stub(chargeVersionYearService, 'createForBatch').resolves([{
      billingBatchChargeVersionId: 'test-id'
    }]);

    result = await populateBatchChargeVersionsProcessor(job);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('a message is logged', async () => {
    const [message] = logger.info.lastCall.args;
    expect(message).to.equal('Handling: test-job-id');
  });

  test('the batch is loaded', async () => {
    expect(batchService.getBatchById.calledWith(
      job.data.batch.id
    )).to.be.true();
  });

  test('billing batch charge versions are created', async () => {
    expect(chargeVersionService.createForBatch.calledWith(
      batch
    )).to.be.true();
  });

  test('billing batch charge version years are created', async () => {
    expect(chargeVersionYearService.createForBatch.calledWith(
      batch
    )).to.be.true();
  });

  test('the calls are executed in the correct order', async () => {
    sinon.assert.callOrder(
      chargeVersionService.createForBatch,
      chargeVersionYearService.createForBatch
    );
  });

  test('the batch and charge version years are returned', async () => {
    expect(result.batch).to.equal(batch);
    expect(result.chargeVersionYears[0].billingBatchChargeVersionId).to.equal('test-id');
  });
});
