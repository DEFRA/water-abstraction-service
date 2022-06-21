const moment = require('moment');
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const scheduledNotifications = require('../../../../src/controllers/notifications');
const { MESSAGE_STATUS_SENT, MESSAGE_STATUS_SENDING, MESSAGE_STATUS_ERROR } =
require('../../../../src/modules/batch-notifications/lib/message-statuses');

const messageHelpers =
require('../../../../src/modules/batch-notifications/lib/message-helpers');

experiment('message helpers', () => {
  const messageId = 'message_1';
  const eventId = 'event_1';

  beforeEach(async () => {
    sandbox.stub(scheduledNotifications.repository, 'update');
    sandbox.stub(scheduledNotifications.repository, 'find')
      .resolves({ rows: [{ id: messageId }] });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('updateMessageStatuses', () => {
    test('selects messages based on the supplied event ID', async () => {
      await messageHelpers.updateMessageStatuses(eventId, MESSAGE_STATUS_SENT);
      const [filter] = scheduledNotifications.repository.update.lastCall.args;
      expect(filter).to.equal({
        event_id: eventId
      });
    });

    test('updates the status only if status not MESSAGE_STATUS_SENDING', async () => {
      await messageHelpers.updateMessageStatuses(eventId, MESSAGE_STATUS_SENT);
      const [, data] = scheduledNotifications.repository.update.lastCall.args;
      expect(data).to.equal({
        status: MESSAGE_STATUS_SENT
      });
    });

    test('updates status and send_after timestamp if status MESSAGE_STATUS_SENDING', async () => {
      const m = moment().format();
      await messageHelpers.updateMessageStatuses(eventId, MESSAGE_STATUS_SENDING);
      const [, data] = scheduledNotifications.repository.update.lastCall.args;
      expect(data.status).to.equal(MESSAGE_STATUS_SENDING);
      expect(data.send_after).to.equal(m);
    });
  });

  experiment('getMessageById', () => {
    test('gets the scheduled_notification row by ID', async () => {
      await messageHelpers.getMessageById(messageId);
      const [filter] = scheduledNotifications.repository.find.lastCall.args;
      expect(filter).to.equal({
        id: messageId
      });
    });

    test('returns the first record found from the scheduled_notification table', async () => {
      const result = await messageHelpers.getMessageById(messageId);
      expect(result.id).to.equal(messageId);
    });
  });

  experiment('markMessageAsSent', () => {
    const notifyResponse = {
      body: {
        id: 'notify_id',
        content: {
          body: 'A test'
        }
      }
    };

    test('finds the message to update using the supplied message ID', async () => {
      await messageHelpers.markMessageAsSent(messageId, notifyResponse);
      const [filter] = scheduledNotifications.repository.update.lastCall.args;
      expect(filter).to.equal({
        id: messageId
      });
    });

    test('updates the message with a status of MESSAGE_STATUS_SENT, the notify ID and message body', async () => {
      await messageHelpers.markMessageAsSent(messageId, notifyResponse);
      const [, data] = scheduledNotifications.repository.update.lastCall.args;
      expect(data.status).to.equal(MESSAGE_STATUS_SENT);
      expect(data.notify_id).to.equal('notify_id');
      expect(data.plaintext).to.equal('A test');
    });
  });

  experiment('markMessageAsErrored', () => {
    const err = new Error('Oh no!');

    test('finds the message to update using the supplied message ID', async () => {
      await messageHelpers.markMessageAsErrored(messageId, err);
      const [filter] = scheduledNotifications.repository.update.lastCall.args;
      expect(filter).to.equal({
        id: messageId
      });
    });

    test('sets message status to MESSAGE_STATUS_ERROR', async () => {
      await messageHelpers.markMessageAsErrored(messageId, err);
      const [, data] = scheduledNotifications.repository.update.lastCall.args;
      expect(data.status).to.equal(MESSAGE_STATUS_ERROR);
    });

    test('sets log text to stringified object with error type and message', async () => {
      await messageHelpers.markMessageAsErrored(messageId, err);
      const [, data] = scheduledNotifications.repository.update.lastCall.args;
      expect(data.log).to.equal(JSON.stringify({
        error: 'Notify error',
        message: err.toString()
      }));
    });
  });
});
