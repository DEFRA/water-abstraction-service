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
const eventsService = require('../../../../src/lib/services/events');
const Event = require('../../../../src/lib/models/event');
const uuid = require('uuid/v4');

const JOB_NAME = 'jobName';
const key = 'testKey';

const eventId = uuid();

const createEvent = () => {
  const event = new Event();
  return event.fromHash({
    id: eventId,
    subtype: 'returnReminder'
  });
};

experiment('batch notifications helpers', () => {
  const event = createEvent();

  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(eventsService, 'findOne').resolves(event);
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
        await (func(eventId));
        const [jobName, data, options] = messageQueue.publish.lastCall.args;
        expect(jobName).to.equal(JOB_NAME);
        expect(data).to.equal({ [key]: eventId });
        expect(options).to.equal({});
      });
    });

    experiment('when the third argument is true', () => {
      test('the created function publishes job with singletonKey option', async () => {
        const func = createJobPublisher(JOB_NAME, key, true);
        await (func(eventId));
        const [jobName, data, options] = messageQueue.publish.lastCall.args;
        expect(jobName).to.equal(JOB_NAME);
        expect(data).to.equal({ [key]: eventId });
        expect(options).to.equal({ singletonKey: eventId });
      });
    });
  });

  experiment('loadJobData', () => {
    test('throws an error if the event cannot be found', async () => {
      eventsService.findOne.resolves(undefined);
      expect(loadJobData()).to.reject();
    });

    test('throws an error if the config cannot be found', async () => {
      eventsService.findOne.resolves(
        createEvent().fromHash({
          subtype: 'unknownMessageType'
        })
      );
      expect(loadJobData()).to.reject();
    });

    test('resolves with event and message data if found', async () => {
      const result = await loadJobData();
      expect(result.ev.id).to.equal(event.id);
      expect(result.config.messageType).to.equal('returnReminder');
    });
  });
});
