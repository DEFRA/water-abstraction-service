const notificationsService = require('../../../../src/lib/services/scheduled-notifications');
const ScheduledNotification = require('../../../../src/lib/models/scheduled-notification');
const { pool } = require('../../../lib/connectors/db');
const { TEST_NOTIFICATION_EMAIL } = require('./constants');
const uuid = require('uuid/v4');

const create = async () => {
  const notification = new ScheduledNotification();
  notification.messageRef = 'test-ref';
  notification.recipient = TEST_NOTIFICATION_EMAIL;
  notification.messageType = 'email';
  notification.notifyId = await uuid();
  notification.plaintext = 'Test';
  notification.dateCreated = new Date();
  notification.personalisation = { one: 1 };
  console.log(notification);
  return notificationsService.createScheduledNotification(notification);
};

const deleteTestNotifications = () => {
  return pool.query(`
    delete from
    water.scheduled_notification
    where message_ref = 'test-ref';
    `);
};

exports.create = create;
exports.delete = deleteTestNotifications;
