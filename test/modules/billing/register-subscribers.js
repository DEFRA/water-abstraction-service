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
const processChargeVersion = require('../../../src/modules/billing/jobs/process-charge-version');

experiment('modules/billing/register-subscribers', () => {
  let server;

  beforeEach(async () => {
    server = {
      messageQueue: {
        subscribe: sandbox.stub().resolves(),
        onComplete: sandbox.stub().resolves()
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

    test('an onComplete handler is registered for populateBatchChargeVersions', async () => {
      expect(server.messageQueue.onComplete.calledWith(populateBatchChargeVersions.jobName)).to.be.true();
    });

    test('a subscribe handler is registered for processChargeVersion', async () => {
      expect(server.messageQueue.subscribe.calledWith(processChargeVersion.jobName)).to.be.true();
    });

    test('an onComplete handler is registered for processChargeVersion', async () => {
      expect(server.messageQueue.onComplete.calledWith(processChargeVersion.jobName)).to.be.true();
    });
  });
});
