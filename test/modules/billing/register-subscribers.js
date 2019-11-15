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
const populateBillingBatch = require('../../../src/modules/billing/jobs/populate-billing-batch');

experiment('modules/billing/register-subscribers', () => {
  let server;

  beforeEach(async () => {
    server = {
      messageQueue: {
        subscribe: sandbox.stub().resolves()
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

    test('the populate billing batch job is registered', async () => {
      expect(server.messageQueue.subscribe.calledWith(
        populateBillingBatch.jobName, populateBillingBatch.handler
      )).to.be.true();
    });
  });
});
