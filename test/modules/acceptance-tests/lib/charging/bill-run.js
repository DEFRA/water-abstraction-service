'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const billRun = require('../../../../../src/modules/acceptance-tests/lib/charging/bill-run');
const batches = require('../../../../../src/modules/acceptance-tests/lib/charging/batches');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const createBillRunJob = require('../../../../../src/modules/billing/jobs/create-bill-run');
const chargeModuleBillRunConnector = require('../../../../../src/lib/connectors/charge-module/bill-runs');
const eventService = require('../../../../../src/lib/services/events');

experiment('modules/acceptance-tests/lib/charging/bill-run', () => {
  const batch = {
    id: 'test-batch-id',
    batchId: 'test-batch-id',
    type: 'annual'
  };

  beforeEach(async () => {
    const request = {
      messageQueue: { publish: sandbox.stub().resolves() }
    };

    sandbox.stub(batchService, 'create').resolves(batch);
    sandbox.stub(createBillRunJob, 'createMessage').resolves();
    sandbox.stub(batches, 'getBatchById').resolves({ billingBatchId: 'test-batch-id', status: 'ready', externalId: 'test-external-id' });
    sandbox.stub(batches, 'updateStatus').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'approve').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'send').resolves();
    sandbox.stub(eventService, 'create').resolves({ id: 'test-event-id' });

    billRun.createBatchAndExecuteBillRun(request, 'test-region-id', 'annual', 2020, false);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createBatchAndExecuteBillRun', async () => {
    test('calls batchService.create with the correct params', async () => {
      const args = batchService.create.lastCall.args;
      expect(args[0]).to.equal('test-region-id');
      expect(args[1]).to.equal('annual');
      expect(args[2]).to.equal(2020);
      expect(args[3]).to.equal(false);
    });
    test('creates a batch event with the correct data', async () => {
      const [event] = eventService.create.lastCall.args;
      expect(event.issuer).to.equal('test@example.com');
      expect(event.metadata).to.equal({ batch });
      expect(event.subtype).to.equal(batch.type);
      expect(event.status).to.equal('start');
    });
    test('creates a job to process the batch', async () => {
      const messageParams = createBillRunJob.createMessage.lastCall.args;
      expect(messageParams[0]).to.equal('test-event-id');
      expect(messageParams[1]).to.equal(batch);
    });
    test('calls the charge module to approve the batch', async () => {
      const args = chargeModuleBillRunConnector.approve.lastCall.args[0];
      expect(args).to.equal('test-external-id');
    });
    test('calls the charge module to send the batch', async () => {
      const args = chargeModuleBillRunConnector.send.lastCall.args[0];
      expect(args).to.equal('test-external-id');
    });
    test('updates the batch status to sent', async () => {
      const args = batches.updateStatus.lastCall.args;
      expect(args[0]).to.equal('test-batch-id');
      expect(args[1]).to.equal('sent');
    });
  });
});
