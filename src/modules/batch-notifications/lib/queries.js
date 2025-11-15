const { pool } = require('../../../lib/connectors/db')
const { MESSAGE_STATUS_SENDING, MESSAGE_STATUS_SENT } = require('./message-statuses')

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
 * Gets a list of all scheduled notifications that require a Notify status check
 * @return {Promise<Array>}
 */
const getNotifyStatusChecks = async () => {
  const query = `
    SELECT
      sn.id
    FROM
      water.scheduled_notification sn
    WHERE
      sn.send_after > (CURRENT_TIMESTAMP - interval '1 week')
      AND (
        sn.notify_status IS NULL
        OR sn.notify_status NOT IN ('permanent-failure', 'technical-failure', 'delivered', 'received', 'validation-failed', 'cancelled')
      )
      AND (
        sn.next_status_check IS NULL
        OR sn.next_status_check <= CURRENT_TIMESTAMP
      )
      AND sn.notify_id IS NOT NULL
      AND sn.status=$1
      AND sn.message_ref IN (
        'email_change_email_in_use_email',
        'email_change_verification_code_email',
        'existing_user_verification_email',
        'expiry_notification_email',
        'new_internal_user_email',
        'new_user_verification_email',
        'password_locked_email',
        'password_reset_email',
        'security_code_letter',
        'share_existing_user',
        'share_new_user'
      );
  `
  const params = [MESSAGE_STATUS_SENT]
  const { rows } = await pool.query(query, params)

  return rows
}

module.exports = {
  getSendingMessageBatch,
  getNotifyStatusChecks
}
