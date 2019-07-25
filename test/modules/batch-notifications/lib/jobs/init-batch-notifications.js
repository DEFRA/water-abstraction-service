const { expect } = require('@hapi/code');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { registerSubscribers } = require('../../../../../src/modules/batch-notifications/lib/jobs/init-batch-notifications');
const messageQueue = require('../../../../../src/lib/message-queue');

const jobs = {
  getRecipients: require('../../../../../src/modules/batch-notifications/lib/jobs/get-recipients'),
  sendMessage: require('../../../../../src/modules/batch-notifications/lib/jobs/send-message'),
  refreshEvent: require('../../../../../src/modules/batch-notifications/lib/jobs/refresh-event'),
  checkStatus: require('../../../../../src/modules/batch-notifications/lib/jobs/check-status')
};

experiment('initialise batch notifications', () => {
  beforeEach(async () => {
    sandbox.stub(messageQueue, 'subscribe').resolves();
    await registerSubscribers(messageQueue);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('registerSubscribers should register the get recipients handler', async () => {
    const [name, func] = messageQueue.subscribe.getCall(0).args;
    expect(name).to.equal(jobs.getRecipients.jobName);
    expect(func).to.equal(jobs.getRecipients.handler);
  });

  test('registerSubscribers should register the send message handler', async () => {
    const [name, func] = messageQueue.subscribe.getCall(1).args;
    expect(name).to.equal(jobs.sendMessage.jobName);
    expect(func).to.equal(jobs.sendMessage.handler);
  });

  test('registerSubscribers should register the refresh event handler', async () => {
    const [name, func] = messageQueue.subscribe.getCall(2).args;
    expect(name).to.equal(jobs.refreshEvent.jobName);
    expect(func).to.equal(jobs.refreshEvent.handler);
  });

  test('registerSubscribers should register the check status handler', async () => {
    const [name, func] = messageQueue.subscribe.getCall(3).args;
    expect(name).to.equal(jobs.checkStatus.jobName);
    expect(func).to.equal(jobs.checkStatus.handler);
  });
});
