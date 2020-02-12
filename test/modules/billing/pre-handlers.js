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
  let h;

  beforeEach(async () => {
    h = {
      continue: 'continue'
    };

    batch = new Batch();
    batch.fromHash({
      id: '7bfdb410-8fe2-41df-bb3a-e85984112f3b',
      status: 'complete'
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

  experiment('.ensureBatchInReviewState', () => {
    experiment('when the batch is not already assigned to request.pre', () => {
      test('an error is thrown', async () => {
        const request = { pre: {} };

        const result = await expect(preHandlers.ensureBatchInReviewState(request, h)).to.reject();
        expect(result.message).to.equal('The batch needs to be assigned to the batch property of pre');
      });
    });

    experiment('when the batch status is not review', () => {
      test('an error is thrown', async () => {
        const request = {
          pre: {
            batch: {
              status: 'processing'
            }
          }
        };

        const result = await expect(preHandlers.ensureBatchInReviewState(request, h)).to.reject();
        const { statusCode, message } = result.output.payload;

        expect(statusCode).to.equal(403);
        expect(message).to.equal('Batch must be in review state. Current status is processing');
      });
    });

    experiment('when the batch status is review', () => {
      let request;

      beforeEach(async () => {
        request = {
          pre: {
            batch: { status: 'review' }
          }
        };
      });

      test('no error is thrown', async () => {
        await expect(preHandlers.ensureBatchInReviewState(request, h)).not.to.reject();
      });

      test('continue is returned', async () => {
        const result = await preHandlers.ensureBatchInReviewState(request, h);
        expect(result).to.equal(h.continue);
      });
    });
  });
});
