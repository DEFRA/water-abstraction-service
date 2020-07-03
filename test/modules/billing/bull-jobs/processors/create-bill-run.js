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
const createBillRunProcessor = require('../../../../../src/modules/billing/bull-jobs/processors/create-bill-run');
const sandbox = require('sinon').createSandbox();

experiment('modules/billing/bull-jobs/processors/create-bill-run', () => {
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
    sandbox.stub(batchService, 'createChargeModuleBillRun').resolves(batch);

    result = await createBillRunProcessor(job);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('a message is logged', async () => {
    const [message] = logger.info.lastCall.args;
    expect(message).to.equal('Handling: test-job-id');
  });

  test('the batch is created in the charge module', async () => {
    expect(batchService.createChargeModuleBillRun.calledWith(batchId)).to.be.true();
  });

  test('resolves with the updated batch', async () => {
    expect(result.batch.id).to.equal(batchId);
  });
});
