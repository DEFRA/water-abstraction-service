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
const messageQueue = require('../../../../../src/lib/message-queue');
const getRecipients = require('../../../../../src/modules/batch-notifications/lib/jobs/get-recipients');
const eventsService = require('../../../../../src/lib/services/events');
const { EVENT_STATUS_ERROR } = require('../../../../../src/modules/batch-notifications/lib/event-statuses');
const { logger } = require('../../../../../src/logger');

experiment('getRecipients job', () => {
  const eventId = 'event_1';

  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(batchNotifications, 'loadJobData').resolves();
    sandbox.stub(eventsService, 'updateStatus').resolves();
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the job name should be notifications.getRecipients', async () => {
    expect(getRecipients.jobName).to.equal('notifications.getRecipients');
  });

  experiment('publish', () => {
    beforeEach(async () => {
      await getRecipients.publish(eventId);
    });
    test('publishes a job with the correct job name', async () => {
      const [jobName] = messageQueue.publish.lastCall.args;
      expect(jobName).to.equal(getRecipients.jobName);
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
        batchNotifications.loadJobData.rejects(err);
        await getRecipients.handler(jobData);
      });

      test('logs the error', async () => {
        const [msg, error, params] = logger.error.lastCall.args;
        expect(msg).to.be.a.string();
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
});
