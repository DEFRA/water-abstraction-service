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

const batchService = require('../../../src/modules/billing/services/batch-service');
const preHandlers = require('../../../src/modules/billing/pre-handlers');
const Batch = require('../../../src/lib/models/batch');
const Region = require('../../../src/lib/models/region');

experiment('modules/billing/pre-handlers', () => {
  let batch;

  beforeEach(async () => {
    batch = new Batch();
    batch.fromHash({
      id: '7bfdb410-8fe2-41df-bb3a-e85984112f3b',
      status: 'ready'
    });
    batch.region = new Region();
    batch.region.fromHash({
      id: '6a464833-d218-4377-98b7-aa5f39acd42c'
    });

    sandbox.stub(batchService, 'getBatchById').resolves(batch);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.loadBatch', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id'
        }
      };
    });

    experiment('when the batch is not found', () => {
      test('a not found error is thrown', async () => {
        batchService.getBatchById.resolves(null);

        const result = await expect(preHandlers.loadBatch(request)).to.reject();
        const { statusCode, message } = result.output.payload;

        expect(statusCode).to.equal(404);
        expect(message).to.equal('No batch found with id: test-batch-id');
      });
    });

    experiment('when the batch is found', () => {
      test('the batch is returned from the function', async () => {
        const result = await preHandlers.loadBatch(request);
        expect(result).to.equal(batch);
      });
    });
  });
});
