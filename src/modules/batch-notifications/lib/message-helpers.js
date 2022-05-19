const moment = require('moment')
const { get } = require('lodash')
const scheduledNotifications = require('../../../controllers/notifications')
const { MESSAGE_STATUS_SENDING, MESSAGE_STATUS_SENT, MESSAGE_STATUS_ERROR } =
  require('./message-statuses')

/**
 * Updates all messages relating to a particular event
 * @param  {String} eventId - event GUID
 * @param  {String} status  - new status for all messages in this event
 * @return {Promise}         resolves when messages updated
 */
const updateMessageStatuses = (eventId, status) => {
  const filter = {
    event_id: eventId
  }
  const data = {
    status
  }
  if (status === MESSAGE_STATUS_SENDING) {
    data.send_after = moment().format()
  }
  return scheduledNotifications.repository.update(filter, data)
}

/**
 * Loads message from table by GUID
 * @param  {String}  messageId - the message GUID
 * @return {Promise}           resolves with row of data (if found)
 */
const getMessageById = async (messageId) => {
  const filter = { id: messageId }
  const { rows: [message] } = await scheduledNotifications.repository.find(filter)
  return message
}

/**
 * Marks message as sent
 * @param  {String}  messageId - the message GUID
 * @param  {Object} notifyResponse - response from Notify REST API
 * @return {Promise}                resolves when message record updated
 */
const markMessageAsSent = (messageId, notifyResponse) => {
  const notifyId = get(notifyResponse, 'body.id', null)
  const plainText = get(notifyResponse, 'body.content.body', '')
  const filter = { id: messageId }
  const data = {
    status: MESSAGE_STATUS_SENT,
    notify_id: notifyId,
    plaintext: plainText
  }
  return scheduledNotifications.repository.update(filter, data)
}

/**
 * Marks message as errored
 * @param  {String}  messageId - the message GUID
 * @param  {Object} error - response from Notify REST API
 * @return {Promise} resolves when message record updated
 */
const markMessageAsErrored = (messageId, error) => {
  const filter = { id: messageId }
  const data = {
    status: MESSAGE_STATUS_ERROR,
    log: JSON.stringify({ error: 'Notify error', message: error.toString() })
  }
  return scheduledNotifications.repository.update(filter, data)
}

module.exports = {
  updateMessageStatuses,
  getMessageById,
  markMessageAsSent,
  markMessageAsErrored
}
