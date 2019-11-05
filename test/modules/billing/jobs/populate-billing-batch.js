const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const messageQueue = require('../../../../src/lib/message-queue');
const event = require('../../../../src/lib/event');
const populateBillingBatchJob = require('../../../../src/modules/billing/jobs/populate-billing-batch');

experiment('modules/billing/jobs/populate-billing-batch', () => {
  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(event, 'save').resolves();
    sandbox.stub(event, 'load').resolves({
      event_id: '00000000-0000-0000-0000-000000000000'
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(populateBillingBatchJob.jobName).to.equal('billing.populateBatch');
  });

  experiment('.publish', () => {
    beforeEach(async () => {
      await populateBillingBatchJob.publish('test-event-id');
    });

    test('publishes using the expected job name', async () => {
      const [name] = messageQueue.publish.lastCall.args;
      expect(name).to.equal('billing.populateBatch');
    });

    test('publishes a data object with the event id', async () => {
      const [, data] = messageQueue.publish.lastCall.args;
      expect(data).to.equal({
        eventId: 'test-event-id'
      });
    });
  });

  experiment('.handler', () => {
    let job;

    beforeEach(async () => {
      job = {
        data: {
          eventId: '22222222-2222-2222-2222-222222222222'
        }
      };

      await populateBillingBatchJob.handler(job);
    });

    test('the event is loaded using the event id in the job', async () => {
      const [eventId] = event.load.lastCall.args;
      expect(eventId).to.equal('22222222-2222-2222-2222-222222222222');
    });

    test('updates the event to complete', async () => {
      const [batchEvent] = event.save.lastCall.args;
      expect(batchEvent.status).to.equal('complete');
    });
  });
});
