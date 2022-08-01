const uuid = require('uuid/v4')
const scheduledNotifications = require('../../controllers/notifications')

const createNotificationBody = (recipient, messageRef, type, personalisation) => ({
  id: uuid(),
  recipient,
  message_ref: messageRef,
  message_type: type,
  personalisation,
  send_after: new Date(),
  status: 'sending'
})

/**
 * Adds a new scheduled notification to the water.scheduled_notification in the
 * 'sending' state which will then be picked up by a cron job that will begin the
 * process of sending the message via Notifiy.
 *
 * @param {String} type The type of message (email|letter)
 * @param {String} recipient The email address of the recipient
 * @param {String} messageRef The message template
 * @param {Object} personalisation Any additional information to inject into the Notify template
 */
const sendMessage = (type, recipient, messageRef, personalisation = {}) => {
  const body = createNotificationBody(recipient, messageRef, type, personalisation)
  const repo = scheduledNotifications.repository
  return repo.create(body)
}

/**
 * Sends an email message via Notifiy.
 *
 * @param {String} recipient The email address of the recipient
 * @param {String} messageRef The message template
 * @param {Object} personalisation Any additional information to inject into the Notify template
 */
const sendEmail = (recipient, messageRef, personalisation) =>
  sendMessage('email', recipient, messageRef, personalisation)

exports.sendMessage = sendMessage
exports.sendEmail = sendEmail
