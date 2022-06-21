const { expect } = require('@hapi/code');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const batchNotifications = require('../../../../../src/modules/batch-notifications/lib/batch-notifications');
const getRecipients = require('../../../../../src/modules/batch-notifications/lib/jobs/get-recipients');
const eventsService = require('../../../../../src/lib/services/events');
const { EVENT_STATUS_ERROR } = require('../../../../../src/modules/batch-notifications/lib/event-statuses');
const { logger } = require('../../../../../src/logger');

experiment('getRecipients job', () => {
  const eventId = 'event_1';
  const jobName = 'notifications.getRecipients';

  beforeEach(async () => {
    sandbox.stub(batchNotifications, 'loadJobData').resolves();
    sandbox.stub(eventsService, 'updateStatus').resolves();
    sandbox.stub(logger, 'error').returns();
    sandbox.stub(logger, 'info').returns();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the job name should be notifications.getRecipients', async () => {
    expect(getRecipients.jobName).to.equal(jobName);
  });

  experiment('.createMessage', () => {
    let msg;

    beforeEach(async () => {
      msg = getRecipients.createMessage(eventId);
    });

    test('creates a msg with the expected name', async () => {
      expect(msg[0]).to.equal(jobName);
    });

    test('the msg has an associated job params of eventId', async () => {
      expect(msg[1]).to.equal({ eventId });
    });

    test('the msg has a simple config object', async () => {
      expect(msg[2]).to.equal({
        jobId: `${jobName}.${eventId}`
      });
    });
  });

  experiment('handle', () => {
    experiment('when there is an error', () => {
      const err = new Error('Oh no!');

      beforeEach(async () => {
        const jobData = { data: { eventId } };
        batchNotifications.loadJobData.rejects(err);
        await getRecipients.handler(jobData);
      });

      test('logs the error', async () => {
        const [msg, error, params] = logger.error.lastCall.args;
        expect(msg).to.equal('Batch notifications handleGetRecipients error');
        expect(error).to.equal(err);
        expect(params).to.equal({ eventId });
      });

      test('updates the event status to error', async () => {
        const [id, status] = eventsService.updateStatus.lastCall.args;
        expect(id).to.equal(eventId);
        expect(status).to.equal(EVENT_STATUS_ERROR);
      });
    });

    experiment('when there are no errors', () => {
      let getRecipientsStub;

      beforeEach(async () => {
        getRecipientsStub = sandbox.stub();
        batchNotifications.loadJobData.resolves({
          config: {
            getRecipients: getRecipientsStub
          },
          ev: {
            eventId
          }
        });
        const jobData = { data: { eventId } };
        await getRecipients.handler(jobData);
      });

      test('loads job data using the eventId from the job data', async () => {
        const { args } = batchNotifications.loadJobData.lastCall;
        expect(args).to.equal([eventId]);
      });

      test('calls the getRecipients method from the notification config', async () => {
        expect(getRecipientsStub.callCount).to.equal(1);
      });

      test('passes data retrieved from loadJobData to the getRecipients method', async () => {
        const [data] = getRecipientsStub.lastCall.args;
        expect(data.ev.eventId).to.equal(eventId);
      });
    });
  });

  experiment('.onFailed', () => {
    test('an error message is logged', async () => {
      const err = new Error('Oh no!');
      await getRecipients.onFailed({}, err);
      const [msg, error] = logger.error.lastCall.args;
      expect(msg).to.equal('notifications.getRecipients: Job has failed');
      expect(error).to.equal(err);
    });
  });

  experiment('.onComplete', () => {
    test('a completion message is logged', async () => {
      await getRecipients.onComplete();
      const [msg] = logger.info.lastCall.args;
      expect(msg).to.equal('notifications.getRecipients: Job has completed');
    });
  });
});
