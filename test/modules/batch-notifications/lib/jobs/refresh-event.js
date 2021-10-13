const { expect } = require('@hapi/code');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const refreshEvent = require('../../../../../src/modules/batch-notifications/lib/jobs/refresh-event');
const eventHelpers = require('../../../../../src/modules/batch-notifications/lib/event-helpers');
const queries = require('../../../../../src/modules/batch-notifications/lib/queries');
const { logger } = require('../../../../../src/logger');

experiment('refreshEvent job', () => {
  const eventId = 'event_1';
  const jobId = 'test-job-id';
  const jobParams = 'test-job-params';

  beforeEach(async () => {
    sandbox.stub(logger, 'error').resolves();
    sandbox.stub(logger, 'info').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the job name should be notifications.refreshEvent', async () => {
    expect(refreshEvent.jobName).to.equal('notifications.refreshEvent');
  });

  experiment('.createMessage', () => {
    let msg;

    beforeEach(async () => {
      msg = refreshEvent.createMessage();
    });

    test('creates a msg with the expected name', async () => {
      expect(msg[0]).to.equal('notifications.refreshEvent');
    });

    test('the msg has no associated job params', async () => {
      expect(msg[1]).to.equal({});
    });

    test('the msg has a config object calling for repeats', async () => {
      expect(msg[2]).to.equal({
        jobId: 'notifications.refreshEvent',
        repeat: {
          every: 60000
        }
      });
    });
  });

  experiment('handle', () => {
    experiment('when there is an error', () => {
      const err = new Error('Oh no!');

      test('logs the error getting the sending events', async () => {
        sandbox.stub(queries, 'getSendingEvents').rejects(err);
        await refreshEvent.handler({ id: jobId, data: jobParams });
        const [msg, error] = logger.error.lastCall.args;
        expect(msg).to.equal(`Error handling: ${jobId}`);
        expect(error).to.equal(err);
      });

      test('logs the error refreshing the event', async () => {
        sandbox.stub(queries, 'getSendingEvents').resolves([{ event_id: eventId }]);
        sandbox.stub(eventHelpers, 'refreshEventStatus').rejects(err);
        await refreshEvent.handler({ id: jobId });
        const [msg, error] = logger.error.lastCall.args;
        expect(msg).to.equal(`Error handling: ${jobId}`);
        expect(error).to.equal(err);
      });
    });

    experiment('when there are no errors', () => {
      test('calls refreshEventStatus with the eventId from the job data', async () => {
        sandbox.stub(queries, 'getSendingEvents').resolves([{ event_id: eventId }]);
        sandbox.stub(eventHelpers, 'refreshEventStatus').resolves();
        await refreshEvent.handler({ id: jobId });
        const { args } = eventHelpers.refreshEventStatus.lastCall;
        expect(args).to.equal([eventId]);
      });
    });
  });

  experiment('.onFailed', () => {
    test('an error message is logged', async () => {
      const err = new Error('Oh no!');
      await refreshEvent.onFailed({}, err);
      const [msg, error] = logger.error.lastCall.args;
      expect(msg).to.equal('notifications.refreshEvent: Job has failed');
      expect(error).to.equal(err);
    });
  });

  experiment('.onComplete', () => {
    test('a completion message is logged', async () => {
      await refreshEvent.onComplete();
      const [msg] = logger.info.lastCall.args;
      expect(msg).to.equal('notifications.refreshEvent: Job has completed');
    });
  });
});
