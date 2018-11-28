/**
 * The purpose of this task is to update the metadata for notifications in the
 * event log
 *
 * @module controllers/tasks/updateNotificationEvents
 */
const moment = require('moment');
const { repository: eventsRepository } = require('../events');
const { repository: notificationsRepository } = require('../notifications');
const logger = require('../../lib/logger');

/**
 * Gets a list of events which are of type 'notification' and which are in
 * a pending state - i.e. some messages within the batch are still pending
 * @return {Promise} resolves with {error, rows}
 */
async function getPendingNotifications () {
  const ts = moment().subtract(3, 'days').format('YYYY-MM-DD HH:mm:ss');

  const filter = {
    type: 'notification',
    created: {
      $gt: ts
    }
  };
  /*
    'metadata->>pending': {
      $gt: 0
    },
    'metadata->>recipients': {
      $gt: 0
    }
  };
  */

  return eventsRepository.find(filter);
}

/**
 * Update metadata
 * @param {Object} existing metadata
 * @param {Array} notifications - a list of notifications from water.scheduled_notification table
 * @return {Object} updated metadata
 */
function getUpdatedMetadata (metadata, notifications) {
  // Count pending/send status
  const stats = notifications.reduce((acc, { status, notify_status: notifyStatus }) => {
    if (status === 'error') {
      acc.error++;
    } else if (notifyStatus === 'delivered') {
      acc.sent++;
    } else if (notifyStatus === 'permanent-failure') {
      acc.error++;
    }
    return acc;
  }, {
    sent: 0,
    error: 0
  });

  return {
    ...metadata,
    ...stats,
    pending: metadata.recipients - (stats.sent + stats.error)
  };
}

/**
 * Process a single event from the water.event table
 * Select all the scheduled notifications for this message, and update the
 * sent stats in the event metadata
 * @param {Object} event
 * @return {Promise} resolves with {error}
 */
async function processEvent (event) {
  const { event_id, metadata } = event;

  const filter = {
    event_id
  };

  const { error, rows } = await notificationsRepository.find(filter);

  if (error) {
    return { error };
  }

  const update = getUpdatedMetadata(metadata, rows);

  logger.info(update);

  return eventsRepository.update({ event_id: event.event_id }, { metadata: update });
}

async function run (config) {
  const { error, rows } = await getPendingNotifications();

  if (error) {
    return { error };
  }

  const errors = [];
  for (let row of rows) {
    const { error } = await processEvent(row);
    if (error) {
      errors.push(error);
    }
  }

  return { error: errors.length ? errors : null };
}

module.exports = {
  run
};
