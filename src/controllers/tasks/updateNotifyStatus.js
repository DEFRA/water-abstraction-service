/**
 * Updates the status from Notify of a sent message where the notify_id is set
 * This allows emails which have bounced to have this status reflected in the
 * message log
 */
/* eslint camelcase: "warn" */
const { pool } = require('../../lib/connectors/db');
const messageQueue = require('../../lib/message-queue');

/**
 * Find records in "water"."scheduled_notification" which have a notify_id
 * but which don't yet have a Notify status
 * @return {Promise} resolves with result from DB call
 */
function getPendingNotifications () {
  const sql = `SELECT id FROM water.scheduled_notification
    WHERE notify_id IS NOT NULL
    AND (notify_status IS NULL OR notify_status='sending')`;

  return pool.query(sql);
}

async function run (config) {
  const { error, rows: notifications } = await getPendingNotifications();

  if (error) {
    return { error };
  }

  // Schedule a check
  notifications.forEach((data) => {
    console.log(`Scheduling notify status check for ${data.id}`);
    messageQueue.publish('notify.status', data);
  });

  return { error: null };
}

module.exports = {
  run
};
