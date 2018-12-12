/**
 * Updates the status from Notify of a sent message where the notify_id is set
 * This allows emails which have bounced to have this status reflected in the
 * message log
 */
/* eslint camelcase: "warn" */
const messageQueue = require('../../lib/message-queue');
const { repository: notificationsRepository } = require('../notifications');
const logger = require('../../lib/logger');

/**
 * Find records in "water"."scheduled_notification" which have a notify_id
 * but which haven't either resolved to a permanent success/failed status
 * @return {Promise} resolves with result from DB call
 */
function getPendingNotifications () {
  const filter = {
    notify_id: {
      $ne: null
    },
    $or: [{
      notify_status: null
    }, {
      notify_status: {
        $nin: ['delivered', 'permanent-failure', 'temporary-failure', 'technical-failure', 'received']
      }
    }]
  };

  const pagination = {
    perPage: 250,
    page: 1
  };

  const sort = {
    send_after: -1
  };

  return notificationsRepository.find(filter, sort, pagination);
}

async function run (config) {
  const { error, rows: notifications } = await getPendingNotifications();

  if (error) {
    return { error };
  }

  try {
    // Schedule a check
    notifications.forEach(async (data) => {
      logger.info(`Scheduling notify status check for ${data.id}`);
      await messageQueue.publish('notify.status', data);
    });

    return { error: null };
  } catch (error) {
    logger.error('Update notify status error', error);
    return { error };
  }
}

module.exports = {
  run
};
