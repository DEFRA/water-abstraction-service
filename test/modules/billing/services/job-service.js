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

const { batchStatus, jobStatus } = require('../../../../src/modules/billing/lib/batch');
const jobService = require('../../../../src/modules/billing/services/job-service');
const repos = require('../../../../src/lib/connectors/repository');
const event = require('../../../../src/lib/event');

experiment('modules/billing/services/jobService', () => {
  beforeEach(async () => {
    sandbox.stub(event, 'updateStatus').resolves();
    sandbox.stub(repos.billingBatches, 'setStatus').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.setCompletedJob', () => {
    beforeEach(async () => {
      await jobService.setCompletedJob('test-event-id', 'test-batch-id');
    });

    test('updates the event status', async () => {
      const [eventId, status] = event.updateStatus.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(status).to.equal(jobStatus.complete);
    });

    test('updates the batch status', async () => {
      const [batchId, status] = repos.billingBatches.setStatus.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
      expect(status).to.equal(batchStatus.complete);
    });
  });

  experiment('.setFailedJob', () => {
    beforeEach(async () => {
      await jobService.setFailedJob('test-event-id', 'test-batch-id');
    });

    test('updates the event status', async () => {
      const [eventId, status] = event.updateStatus.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(status).to.equal(jobStatus.error);
    });

    test('updates the batch status', async () => {
      const [batchId, status] = repos.billingBatches.setStatus.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
      expect(status).to.equal(batchStatus.error);
    });
  });
});
