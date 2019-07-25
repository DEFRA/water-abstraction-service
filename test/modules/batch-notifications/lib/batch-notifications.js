const { expect } = require('@hapi/code');
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { createJobPublisher, loadJobData } =
require('../../../../src/modules/batch-notifications/lib/batch-notifications');
const messageQueue = require('../../../../src/lib/message-queue');
const evt = require('../../../../src/lib/event');

const JOB_NAME = 'jobName';
const key = 'testKey';
const id = 'id';
const ev = {
  eventId: 'testEvent',
  subtype: 'returnReminder'
};

experiment('batch notifications helpers', () => {
  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(evt, 'load').resolves(ev);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('createJobPublisher', () => {
    test('creates a function', async () => {
      const func = createJobPublisher(JOB_NAME, key);
      expect(func).to.be.a.function();
    });

    experiment('when the third argument is false', () => {
      test('the created function publishes job with no options', async () => {
        const func = createJobPublisher(JOB_NAME, key, false);
        await (func(id));
        const [jobName, data, options] = messageQueue.publish.lastCall.args;
        expect(jobName).to.equal(JOB_NAME);
        expect(data).to.equal({ [key]: id });
        expect(options).to.equal({});
      });
    });

    experiment('when the third argument is true', () => {
      test('the created function publishes job with singletonKey option', async () => {
        const func = createJobPublisher(JOB_NAME, key, true);
        await (func(id));
        const [jobName, data, options] = messageQueue.publish.lastCall.args;
        expect(jobName).to.equal(JOB_NAME);
        expect(data).to.equal({ [key]: id });
        expect(options).to.equal({ singletonKey: id });
      });
    });
  });

  experiment('loadJobData', () => {
    test('throws an error if the event cannot be found', async () => {
      evt.load.resolves(undefined);
      expect(loadJobData()).to.reject();
    });

    test('throws an error if the config cannot be found', async () => {
      evt.load.resolves({
        subtype: 'unknownMessageType'
      });
      expect(loadJobData()).to.reject();
    });

    test('resolves with event and message data if found', async () => {
      const result = await loadJobData();
      expect(result.ev).to.equal(ev);
      expect(result.config.messageType).to.equal('returnReminder');
    });
  });
});
