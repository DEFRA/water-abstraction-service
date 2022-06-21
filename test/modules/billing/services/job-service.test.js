'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { BATCH_STATUS } = require('../../../../src/lib/models/batch');
const { jobStatus } = require('../../../../src/modules/billing/lib/event');
const jobService = require('../../../../src/modules/billing/services/job-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const eventService = require('../../../../src/lib/services/events');

experiment('modules/billing/services/jobService', () => {
  beforeEach(async () => {
    sandbox.stub(eventService, 'updateStatus').resolves();
    sandbox.stub(batchService, 'setStatus').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.setReadyJob', () => {
    beforeEach(async () => {
      await jobService.setReadyJob('test-event-id', 'test-batch-id');
    });

    test('updates the event status', async () => {
      const [eventId, status] = eventService.updateStatus.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(status).to.equal(jobStatus.complete);
    });

    test('updates the batch status', async () => {
      const [batchId, status] = batchService.setStatus.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
      expect(status).to.equal(BATCH_STATUS.ready);
    });
  });

  experiment('.setFailedJob', () => {
    beforeEach(async () => {
      await jobService.setFailedJob('test-event-id', 'test-batch-id');
    });

    test('updates the event status', async () => {
      const [eventId, status] = eventService.updateStatus.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(status).to.equal(jobStatus.error);
    });

    test('updates the batch status', async () => {
      const [batchId, status] = batchService.setStatus.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
      expect(status).to.equal(BATCH_STATUS.error);
    });
  });

  experiment('.setReviewJob', () => {
    beforeEach(async () => {
      await jobService.setReviewJob('test-event-id', 'test-batch-id');
    });

    test('updates the event status', async () => {
      const [eventId, status] = eventService.updateStatus.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(status).to.equal(jobStatus.review);
    });

    test('updates the batch status', async () => {
      const [batchId, status] = batchService.setStatus.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
      expect(status).to.equal(BATCH_STATUS.review);
    });
  });
});
