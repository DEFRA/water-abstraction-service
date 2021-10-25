const { expect } = require('@hapi/code');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const sendMessage = require('../../../../../src/modules/batch-notifications/lib/jobs/send-message');
const messageHelpers = require('../../../../../src/modules/batch-notifications/lib/message-helpers');
const notifyConnector = require('../../../../../src/modules/batch-notifications/lib/notify-connector');
const scheduledNotificationService = require('../../../../../src/lib/services/scheduled-notifications');
const licenceGaugingStationConnector = require('../../../../../src/lib/connectors/repos/licence-gauging-stations');
const ScheduledNotification = require('../../../../../src/lib/models/scheduled-notification');
const queries = require('../../../../../src/modules/batch-notifications/lib/queries');
const { logger } = require('../../../../../src/logger');

experiment('sendMessage job', () => {
  const jobId = 'test-job-id';
  const messageId = uuid();
  const licenceGaugingStationId = uuid();
  const sendingAlertType = 'water_abstraction_alert';
  let scheduledNotification;

  beforeEach(async () => {
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
    sandbox.stub(logger, 'info');

    scheduledNotification = new ScheduledNotification(messageId);

    scheduledNotification.messageRef = sendingAlertType;
    scheduledNotification.personalisation = {
      licenceGaugingStationId, sending_alert_type: sendingAlertType
    };

    sandbox.stub(scheduledNotificationService, 'updateScheduledNotificationWithNotifyResponse');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the job name should be notifications.sendMessage', async () => {
    expect(sendMessage.jobName).to.equal('notifications.sendMessage');
  });

  experiment('.createMessage', () => {
    let msg;

    beforeEach(async () => {
      msg = sendMessage.createMessage();
    });

    test('creates a msg with the expected name', async () => {
      expect(msg[0]).to.equal('notifications.sendMessage');
    });

    test('the msg has no associated job params', async () => {
      expect(msg[1]).to.equal({});
    });

    test('the msg has a config object calling for repeats', async () => {
      expect(msg[2]).to.equal({
        jobId: 'notifications.sendMessage',
        repeat: {
          every: 15000
        }
      });
    });
  });

  experiment('handleSendMessage', () => {
    experiment('when there is an error', () => {
      const err = new Error('Oh no!');

      test('logs the error when getSendingMessageBatch fails', async () => {
        sandbox.stub(queries, 'getSendingMessageBatch').rejects(err);
        await sendMessage.handler({ id: jobId });
        const [msg, error] = logger.error.lastCall.args;
        expect(msg).to.equal(`Error handling: ${jobId}`);
        expect(error).to.equal(err);
      });

      test('sets the scheduled_notification status to MESSAGE_STATUS_ERROR', async () => {
        sandbox.stub(queries, 'getSendingMessageBatch').resolves([{ id: messageId }]);
        sandbox.stub(scheduledNotificationService, 'getScheduledNotificationById').rejects(err);
        await sendMessage.handler({ id: jobId });
        const [msg, error] = messageHelpers.markMessageAsErrored.lastCall.args;
        expect(msg).to.equal(messageId);
        expect(error).to.equal(err);
      });
    });
  });

  experiment('when there are no errors', () => {
    beforeEach(async () => {
      sandbox.stub(queries, 'getSendingMessageBatch').resolves([{ id: messageId }]);
      sandbox.stub(licenceGaugingStationConnector, 'updateStatus').resolves();
      sandbox.stub(scheduledNotificationService, 'getScheduledNotificationById').resolves(
        scheduledNotification
      );
      await sendMessage.handler({ id: jobId });
    });

    test('loads the scheduled_notification with the message ID from the job data', async () => {
      expect(scheduledNotificationService.getScheduledNotificationById.calledWith(
        messageId
      )).to.be.true();
    });

    test('updates the status of the licence gauging station connector', async () => {
      expect(licenceGaugingStationConnector.updateStatus.calledWith(
        licenceGaugingStationId, sendingAlertType
      )).to.be.true();
    });

    test('sends the message', async () => {
      expect(notifyConnector.send.callCount).to.equal(1);
      expect(notifyConnector.send.calledWith(
        scheduledNotification
      )).to.be.true();
    });

    test('marks message as sent', async () => {
      const [id, notifyResponse] = scheduledNotificationService.updateScheduledNotificationWithNotifyResponse.lastCall.args;
      expect(id).to.equal(messageId);
      expect(notifyResponse).to.be.an.object();
    });
  });

  experiment('.onFailed', () => {
    test('an error message is logged', async () => {
      const err = new Error('Oh no!');
      await sendMessage.onFailed({}, err);
      const [msg, error] = logger.error.lastCall.args;
      expect(msg).to.equal('notifications.sendMessage: Job has failed');
      expect(error).to.equal(err);
    });
  });

  experiment('.onComplete', () => {
    test('a completion message is logged', async () => {
      await sendMessage.onComplete();
      const [msg] = logger.info.lastCall.args;
      expect(msg).to.equal('notifications.sendMessage: Job has completed');
    });
  });
});
