const { expect } = require('@hapi/code');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const messageQueue = require('../../../../../src/lib/message-queue');
const refreshEvent = require('../../../../../src/modules/batch-notifications/lib/jobs/refresh-event');
const eventHelpers = require('../../../../../src/modules/batch-notifications/lib/event-helpers');
const { logger } = require('../../../../../src/logger');

experiment('refreshEvent job', () => {
  const eventId = 'event_1';

  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(eventHelpers, 'refreshEventStatus').resolves();
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the job name should be notifications.refreshEvent', async () => {
    expect(refreshEvent.jobName).to.equal('notifications.refreshEvent');
  });

  experiment('publish', () => {
    beforeEach(async () => {
      await refreshEvent.publish(eventId);
    });
    test('publishes a job with the correct job name', async () => {
      const [jobName] = messageQueue.publish.lastCall.args;
      expect(jobName).to.equal(refreshEvent.jobName);
    });
    test('includes the event ID in the job data', async () => {
      const [, data] = messageQueue.publish.lastCall.args;
      expect(data).to.equal({ eventId });
    });
    test('uses the event ID as a singleton key in the job options', async () => {
      const [, , options] = messageQueue.publish.lastCall.args;
      expect(options).to.equal({ singletonKey: eventId });
    });
  });

  experiment('handle', () => {
    experiment('when there is an error', () => {
      const err = new Error('Oh no!');

      beforeEach(async () => {
        const jobData = { data: { eventId } };
        eventHelpers.refreshEventStatus.rejects(err);
        await refreshEvent.handler(jobData);
      });

      test('logs the error', async () => {
        const [msg, error, params] = logger.error.lastCall.args;
        expect(msg).to.be.a.string();
        expect(error).to.equal(err);
        expect(params).to.equal({ eventId });
      });
    });
  });

  experiment('when there are no errors', () => {
    beforeEach(async () => {
      const jobData = { data: { eventId } };
      await refreshEvent.handler(jobData);
    });

    test('calls refreshEventStatus with the eventId from the job data', async () => {
      const { args } = eventHelpers.refreshEventStatus.lastCall;
      expect(args).to.equal([eventId]);
    });
  });
});
