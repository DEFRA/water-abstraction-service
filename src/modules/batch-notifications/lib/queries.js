const { pool } = require('../../../lib/connectors/db')
const { MESSAGE_STATUS_SENDING, MESSAGE_STATUS_SENT } = require('./message-statuses')
const { EVENT_STATUS_SENDING } = require('./event-statuses')

/**
 * Gets a batch of messages to scheduled sending
 * @return {Promise} resolves with messages in 'sending' status
 */
const getSendingMessageBatch = async () => {
  const query = `SELECT id
    FROM water.scheduled_notification
    WHERE status=$1
    AND send_after<NOW() AND send_after>(CURRENT_TIMESTAMP - interval '1 week')
    ORDER BY send_after
    LIMIT 100`
  const params = [MESSAGE_STATUS_SENDING]
  const { rows } = await pool.query(query, params)
  return rows
}

/**
 * Gets all recent notification events with a status of 'sending'
 * @return {Promise} resolves with events in 'sending' status
 */
const getSendingEvents = async () => {
  const query = `SELECT event_id
    FROM water.events
    WHERE type='notification' AND status=$1
    AND created>(CURRENT_TIMESTAMP - interval '1 week')
    `
  const params = [EVENT_STATUS_SENDING]
  const { rows } = await pool.query(query, params)
  return rows
}

/**
 * Gets a breakdown of message statuses for a particular event ID
 * @param {String} eventId - the event GUID
 * @return {Promise<Array>} list of statuses and the number of messages in that status
 */
const getMessageStatuses = async eventId => {
  const query = `SELECT DISTINCT status, COUNT(id) AS "count"
    FROM water.scheduled_notification
    WHERE event_id=$1
    GROUP BY status
  `
  const params = [eventId]

  const { rows } = await pool.query(query, params)
  return rows
}

/**
 * Gets a list of all scheduled notifications that require a Notify status check
 * @return {Promise<Array>}
 */
const getNotifyStatusChecks = async () => {
  const query = `SELECT id
    FROM water.scheduled_notification
    WHERE send_after>(CURRENT_TIMESTAMP - interval '1 week')
    AND (notify_status IS NULL OR notify_status NOT IN ('permanent-failure', 'technical-failure', 'delivered', 'received', 'validation-failed', 'cancelled'))
    AND (next_status_check IS NULL OR next_status_check<=CURRENT_TIMESTAMP)
    AND notify_id IS NOT NULL
    AND status=$1
  `
  const params = [MESSAGE_STATUS_SENT]
  const { rows } = await pool.query(query, params)
  return rows
}

module.exports = {
  getSendingMessageBatch,
  getSendingEvents,
  getMessageStatuses,
  getNotifyStatusChecks
}
