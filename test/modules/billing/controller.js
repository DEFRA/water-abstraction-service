const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const repos = require('../../../src/lib/connectors/repository');
const event = require('../../../src/lib/event');
const populateBillingBatchJob = require('../../../src/modules/billing/jobs/populate-billing-batch');

const controller = require('../../../src/modules/billing/controller');

experiment('modules/billing/controller', () => {
  let h, hapiResponseStub;

  beforeEach(async () => {
    hapiResponseStub = {
      code: sandbox.stub().returnsThis()
    };

    h = {
      response: sandbox.stub().returns(hapiResponseStub)
    };

    sandbox.stub(repos.billingBatches, 'createBatch').resolves({
      rows: [
        {
          batch_type: 'annual',
          billing_batch_id: '00000000-0000-0000-0000-000000000000'
        }
      ]
    });

    sandbox.stub(event, 'save').resolves({
      rows: [
        {
          event_id: '11111111-1111-1111-1111-111111111111'
        }
      ]
    });

    sandbox.stub(populateBillingBatchJob, 'publish').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.postCreateBatch', () => {
    let request;

    beforeEach(async () => {
      request = {
        payload: {
          userEmail: 'test@example.com',
          regionId: '22222222-2222-2222-2222-222222222222',
          batchType: 'annual',
          financialYear: 2019,
          season: 'summer'
        }
      };

      await controller.postCreateBatch(request, h);
    });

    test('creates a new entry in the billing_batches table', async () => {
      expect(repos.billingBatches.createBatch.calledWith(
        request.payload.regionId,
        request.payload.batchType,
        request.payload.financialYear,
        request.payload.season
      )).to.be.true();
    });

    test('creates a new event with the created batch', async () => {
      const [savedEvent] = event.save.lastCall.args;
      expect(savedEvent.type).to.equal('billing-batch');
      expect(savedEvent.subtype).to.equal(request.payload.batchType);
      expect(savedEvent.issuer).to.equal(request.payload.userEmail);
      expect(savedEvent.metadata.batch.billing_batch_id).to.equal('00000000-0000-0000-0000-000000000000');
      expect(savedEvent.status).to.equal('received');
    });

    test('publishes a new job to the message queue with the event id', async () => {
      const [eventId] = populateBillingBatchJob.publish.lastCall.args;
      expect(eventId).to.equal('11111111-1111-1111-1111-111111111111');
    });

    test('the response contains the event', async () => {
      const [{ data }] = h.response.lastCall.args;
      expect(data.event.event_id).to.equal('11111111-1111-1111-1111-111111111111');
    });

    test('the response contains a URL to the event', async () => {
      const [{ data }] = h.response.lastCall.args;
      expect(data.url).to.equal('/water/1.0/event/11111111-1111-1111-1111-111111111111');
    });

    test('a 202 response code is used', async () => {
      const [code] = hapiResponseStub.code.lastCall.args;
      expect(code).to.equal(202);
    });
  });
});
