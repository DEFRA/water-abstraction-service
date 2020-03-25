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
const jobs = require('../../../src/modules/billing/jobs');

experiment('modules/billing/register-subscribers', () => {
  let server;

  beforeEach(async () => {
    server = {
      createSubscription: sandbox.stub().resolves()
    };

    sandbox.stub(jobs.populateBatchChargeVersions, 'onCompleteHandler').resolves();
    sandbox.stub(jobs.processChargeVersion, 'onCompleteHandler').resolves();
    sandbox.stub(jobs.prepareTransactions, 'onCompleteHandler').resolves();
    sandbox.stub(jobs.createCharge, 'onCompleteHandler').resolves();
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

  experiment('when the plugin is registered', async () => {
    beforeEach(async () => {
      await registerSubscribers.register(server);
    });

    test('registers populateBatchChargeVersions job', async () => {
      expect(server.createSubscription.calledWith(
        jobs.populateBatchChargeVersions
      )).to.be.true();
    });

    test('registers processChargeVersion job', async () => {
      expect(server.createSubscription.calledWith(
        jobs.processChargeVersion
      )).to.be.true();
    });

    test('registers prepareTransactions job', async () => {
      expect(server.createSubscription.calledWith(
        jobs.prepareTransactions
      )).to.be.true();
    });

    test('registers createCharge job', async () => {
      expect(server.createSubscription.calledWith(
        jobs.createCharge
      )).to.be.true();
    });

    test('registers refreshTotals job', async () => {
      expect(server.createSubscription.calledWith(
        jobs.refreshTotals
      )).to.be.true();
    });
  });
});
