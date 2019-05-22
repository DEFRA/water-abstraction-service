const { expect } = require('code');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const batchNotifications = require('../../../../../src/modules/batch-notifications/lib/batch-notifications');
const messageQueue = require('../../../../../src/lib/message-queue');
const sendMessage = require('../../../../../src/modules/batch-notifications/lib/jobs/send-message');
const eventHelpers = require('../../../../../src/modules/batch-notifications/lib/event-helpers');
const messageHelpers = require('../../../../../src/modules/batch-notifications/lib/message-helpers');
const notifyConnector = require('../../../../../src/modules/batch-notifications/lib/notify-connector');

const { logger } = require('@envage/water-abstraction-helpers');

experiment('refreshEvent job', () => {
  const messageId = 'message_1';

  beforeEach(async () => {
    sandbox.stub(messageQueue, 'publish').resolves();
    sandbox.stub(batchNotifications, 'loadJobData').resolves();
    sandbox.stub(eventHelpers, 'refreshEventStatus').resolves();
    sandbox.stub(messageHelpers, 'getMessageById').resolves({
      id: messageId,
      personalisation: {
        address_line_1: '1 Daisy Farm',
        postcode: 'TT1 1TT'
      }
    });
    sandbox.stub(messageHelpers, 'markMessageAsErrored').resolves();
    sandbox.stub(messageHelpers, 'markMessageAsSent').resolves();
    sandbox.stub(notifyConnector, 'send').resolves({
      body: {
        id: 'notify_id',
        content: {
          body: 'Test message'
        }
      }
    });
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the job name should be notifications.sendMessage', async () => {
    expect(sendMessage.jobName).to.equal('notifications.sendMessage');
  });

  experiment('publish', () => {
    beforeEach(async () => {
      await sendMessage.publish(messageId);
    });
    test('publishes a job with the correct job name', async () => {
      const [jobName] = messageQueue.publish.lastCall.args;
      expect(jobName).to.equal(sendMessage.jobName);
    });
    test('includes the message ID in the job data', async () => {
      const [, data] = messageQueue.publish.lastCall.args;
      expect(data).to.equal({messageId});
    });
    test('uses the message ID as a singleton key in the job options', async () => {
      const [, , options] = messageQueue.publish.lastCall.args;
      expect(options).to.equal({ singletonKey: messageId });
    });
  });

  experiment('handle', () => {
    experiment('when there is an error', () => {
      const err = new Error('Oh no!');

      beforeEach(async () => {
        const jobData = { data: { messageId } };
        messageHelpers.getMessageById.rejects(err);
        await sendMessage.handler(jobData);
      });

      test('logs the error', async () => {
        const [ msg, error, params ] = logger.error.lastCall.args;
        expect(msg).to.be.a.string();
        expect(error).to.equal(err);
        expect(params).to.equal({ messageId });
      });

      test('sets the scheduled_notification status to MESSAGE_STATUS_ERROR', async () => {
        const { args } = messageHelpers.markMessageAsErrored.lastCall;
        expect(args[0]).to.equal(messageId);
        expect(args[1]).to.equal(err);
      });
    });
  });

  experiment('when there are no errors', () => {
    beforeEach(async () => {
      const jobData = { data: { messageId } };
      await sendMessage.handler(jobData);
    });

    test('loads the scheduled_notification with the message ID from the job data', async () => {
      const { args } = messageHelpers.getMessageById.lastCall;
      expect(args).to.equal([messageId]);
    });

    test('sends the message', async () => {
      expect(notifyConnector.send.callCount).to.equal(1);
      const [ message ] = notifyConnector.send.lastCall.args;
      expect(message.id).to.equal(messageId);
    });

    test('marks message as sent', async () => {
      const [id, notifyResponse] = messageHelpers.markMessageAsSent.lastCall.args;
      expect(id).to.equal(messageId);
      expect(notifyResponse).to.be.an.object();
    });
  });
});
