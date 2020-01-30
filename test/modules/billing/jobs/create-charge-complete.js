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

const { logger } = require('../../../../src/logger');
const createChargeComplete = require('../../../../src/modules/billing/jobs/create-charge-complete');
const jobService = require('../../../../src/modules/billing/services/job-service');

experiment('modules/billing/jobs/create-charge-complete', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(jobService, 'setCompletedJob').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.when there are no more transactions to create', () => {
    beforeEach(async () => {
      const job = {
        data: {
          request: {
            data: {
              eventId: 'test-event-id'
            }
          },
          response: {
            batch: {
              billing_batch_id: 'test-batch-id'
            }
          }
        }
      };
      await createChargeComplete(job);
    });

    test('the batch is marked as completed', async () => {
      const [eventId, batchId] = jobService.setCompletedJob.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(batchId).to.equal('test-batch-id');
    });
  });
});
