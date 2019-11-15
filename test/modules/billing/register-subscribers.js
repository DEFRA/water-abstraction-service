const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const registerSubscribers = require('../../../src/modules/billing/register-subscribers');
const populateBatchChargeVersions = require('../../../src/modules/billing/jobs/populate-batch-charge-versions');
const populateBatchTransactions = require('../../../src/modules/billing/jobs/populate-batch-transactions');

experiment('modules/billing/register-subscribers', () => {
  let server;
  let onCompleteHandlers;

  beforeEach(async () => {
    onCompleteHandlers = {};
    server = {
      messageQueue: {
        subscribe: sandbox.stub().resolves(),
        onComplete: sandbox.stub().callsFake((jobName, handler) => {
        // capture the assigned handlers for later testing
          onCompleteHandlers[jobName] = handler;
          return Promise.resolve();
        }),
        publish: sandbox.stub().resolves()
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('plugin has a name', async () => {
    expect(registerSubscribers.name).to.equal('billingRegisterSubscribers');
  });

  test('plugin has a register function', async () => {
    expect(registerSubscribers.register).to.be.a.function();
  });

  experiment('when the plugin is registered with the server', async () => {
    beforeEach(async () => {
      await registerSubscribers.register(server);
    });

    test('the populate billing batch charge versions job is registered', async () => {
      expect(server.messageQueue.subscribe.calledWith(
        populateBatchChargeVersions.jobName, populateBatchChargeVersions.handler
      )).to.be.true();
    });

    test('the populate billing batch charge transactions job is registered', async () => {
      expect(server.messageQueue.subscribe.calledWith(
        populateBatchTransactions.jobName, populateBatchTransactions.handler
      )).to.be.true();
    });
  });

  experiment('when the populateBachChargeVersions job completes', () => {
    experiment('and the job created charge versions', () => {
      test('the populateBatchTransactions job is published', async () => {
        const job = {
          data: {
            request: {
              data: { eventId: 'test-event-id' }
            },
            response: { chargeVersionCount: 10 }
          }
        };

        await registerSubscribers.register(server);
        await onCompleteHandlers[populateBatchChargeVersions.jobName](job);

        expect(server.messageQueue.publish.calledWith({
          name: 'billing.populate-batch-transactions',
          data: {
            eventId: 'test-event-id'
          }
        })).to.be.true();
      });
    });

    experiment('and no charge versions were found', () => {
      test('the populateBatchTransactions job is not published', async () => {
        const job = {
          data: {
            request: {
              data: { eventId: 'test-event-id' }
            },
            response: { chargeVersionCount: 0 }
          }
        };

        await registerSubscribers.register(server);
        await onCompleteHandlers[populateBatchChargeVersions.jobName](job);
        expect(server.messageQueue.publish.called).to.be.false();
      });
    });
  });
});
