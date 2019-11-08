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
const populateBatchTransactionsJob = require('../../../../src/modules/billing/jobs/populate-batch-transactions');

experiment('modules/billing/jobs/populate-batch-transactions', () => {
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
    expect(populateBatchTransactionsJob.jobName).to.equal('billing.populate-batch-transactions');
  });

  experiment('.publish', () => {
    beforeEach(async () => {
      await populateBatchTransactionsJob.publish('test-event-id');
    });

    test('publishes using the expected job name', async () => {
      const [name] = messageQueue.publish.lastCall.args;
      expect(name).to.equal('billing.populate-batch-transactions');
    });

    test('publishes a data object with the event id', async () => {
      const [, data] = messageQueue.publish.lastCall.args;
      expect(data).to.equal({
        eventId: 'test-event-id'
      });
    });
  });
});
