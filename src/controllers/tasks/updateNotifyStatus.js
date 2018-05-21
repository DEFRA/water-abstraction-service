/**
 * Updates the status from Notify of a sent message where the notify_id is set
 * This allows emails which have bounced to have this status reflected in the
 * message log
 */
/* eslint camelcase: "warn" */
const { repository: notificationsRepository } = require('../notifications');
const NotifyClient = require('notifications-node-client').NotifyClient;
const notifyClient = new NotifyClient(process.env.LIVE_NOTIFY_KEY);
const moment = require('moment');

/**
 * Update message
 * @param {Object} row - single row from  "water"."scheduled_notification"
 * @return {Promise} resolves when status updated
 */
async function updateMessage (row) {
  const { body: { status } } = await notifyClient
    .getNotificationById(row.notify_id);

  return notificationsRepository.update({ id: row.id }, { notify_status: status });
}

/**
 * Find records in "water"."scheduled_notification" which have a notify_id
 * but which don't yet have a Notify status
 * @return {Promise} resolves with result from DB call
 */
function getPendingNotifications () {
  // Create timestamp for 3 days ago
  // We need to keep updating as could start as 'delivered' but move to
  // failure later
  const ts = moment().subtract(3, 'days').format('YYYY-MM-DD HH:mm:ss');

  return notificationsRepository.find({
    notify_id: {
      $ne: null
    },
    send_after: {
      $gt: ts
    },
    notify_status: {
      $ne: 'permanent-failure'
    }
  });
}

async function run (config) {
  const { error, rows: notifications } = await getPendingNotifications();

  if (error) {
    return { error };
  }

  for (let message of notifications) {
    await updateMessage(message);
  }

  return { error: null };
}

module.exports = {
  run
};
