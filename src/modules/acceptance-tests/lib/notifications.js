const notificationsService = require('../../../../src/lib/services/scheduled-notifications')
const ScheduledNotification = require('../../../../src/lib/models/scheduled-notification')
const { pool } = require('../../../lib/connectors/db')
const { TEST_NOTIFICATION_EMAIL } = require('./constants')
const uuid = require('uuid/v4')

const create = async () => {
  const notification = new ScheduledNotification()
  notification.messageRef = 'test-ref'
  notification.recipient = TEST_NOTIFICATION_EMAIL
  notification.messageType = 'email'
  notification.notifyId = await uuid()
  notification.plaintext = 'Test'
  notification.dateCreated = new Date()
  notification.personalisation = { one: 1 }
  return notificationsService.createScheduledNotification(notification)
}

const deleteMessageQuery = `
delete from
water.scheduled_notification
where message_ref = 'test-ref';
`

const deleteMessagesRelatingToTestEvents = `
delete from 
water.scheduled_notification sn
using water.events e
where sn.event_id=e.event_id and strpos(e.issuer, 'acceptance-test') = 1;
`

const deleteTestNotifications = () => Promise.all([
  pool.query(deleteMessageQuery),
  pool.query(deleteMessagesRelatingToTestEvents)
])

exports.create = create
exports.delete = deleteTestNotifications
