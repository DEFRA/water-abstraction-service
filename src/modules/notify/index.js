/**
 * Notify flow:
 * - enqueue - adds record in scheduled_notification table, fire 'send' now or in future
 * - send - sends notify message, fire 'status' at several regular intervals in future
 * - status - checks status in notify, updates scheduled_notification table
 */
// const notifyTemplateRepo = require('../controllers/notifytemplates').repository;
const NotifyClient = require('notifications-node-client').NotifyClient;
const moment = require('moment');
const { mapValues } = require('lodash');
const snakeCaseKeys = require('snakecase-keys');

const { getTemplate, getNotifyKey, sendMessage, validateEnqueueOptions } = require('./helpers');
const scheduledNotification = require('../../controllers/notifications').repository;
const { NotificationNotFoundError, NotifyIdError, AlreadySentError } = require('./errors');
const { isObject } = require('lodash');

/**
 * Updates the notify_status field for the message with the given ID
 * @param {String} id - water.scheduled_notification id
 */
async function updateMessageStatus (id) {
  // Load water.scheduled_notification record from DB
  const { rows: [data], error } = await scheduledNotification.find({ id });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotificationNotFoundError();
  }

  const { notify_id: notifyId } = data;

  if (!notifyId) {
    throw new NotifyIdError();
  }

  // We are only checking status here so OK to use live notify key
  const client = new NotifyClient(process.env.LIVE_NOTIFY_KEY);

  const { body: { status } } = await client.getNotificationById(notifyId);

  await scheduledNotification.update({ id }, { notify_status: status });
}

/**
 * Marks record in scheduled_notification table as sent
 * Also records notify ID and rendered body
 * @param {String} id - GUID or other ID
 * @param {Object} notifyResponse
 * @return {Promise} resolves on DB success/error
 */
function markAsSent (id, notifyResponse) {
  // Update plaintext value with what Notify actually sent
  return scheduledNotification.update({ id }, {
    status: 'sent',
    notify_id: notifyResponse.id,
    plaintext: notifyResponse.content.body
  });
}

/**
 * Send message
 * @param {String} id - water.scheduled_notification id
 * @return {Promise} resolves with { data, notifyResponse }
 */
async function send (id) {
  // Load water.scheduled_notification record from DB
  const { rows: [data], error } = await scheduledNotification.find({ id });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotificationNotFoundError();
  }

  if (data.status) {
    throw new AlreadySentError();
  }

  const { personalisation, message_ref: messageRef, recipient } = data;

  // Load template from notify_templates table
  const notifyTemplate = await getTemplate(messageRef);

  // Send message with Notify API
  try {
    const { body: notifyResponse } = await sendMessage(notifyTemplate, personalisation, recipient);

    // Update plaintext value with what Notify actually sent
    await markAsSent(id, notifyResponse);

    return {
      data
    };
  } catch (error) {
    // Log notify error
    await scheduledNotification.update({ id }, {
      status: 'error',
      log: JSON.stringify({ error: 'Notify error', message: error.toString() })
    });

    throw error;
  }
}

/**
 * Writes scheduled notification data to DB
 * @param {Object} row
 * @return {Promise}
 */
async function writeScheduledNotificationRow (row) {
  const { error: dbError } = await scheduledNotification.create(row);
  if (dbError) {
    console.error(dbError);
    throw dbError;
  }
}

/**
 * @param {Object} messageQueue - PG boss instance
 * @param {Object} row - row data
 * @param {String} ISO 8601 timestamp
 * @return {Number} number of seconds until event starts
 */
function scheduleSendEvent (messageQueue, row, now) {
  // Schedule send event
  const startIn = Math.round(moment(row.send_after).diff(moment(now)) / 1000);
  messageQueue.publish('notify.send', row, {
    startIn,
    singletonKey: row.id
  });
  return startIn;
}

/**
 * Converts object keys to snake case, and non-scalars to stringified JSON
 * @param {Object} data
 * @return {Object}
 */
function formatRowData (data) {
  return mapValues(snakeCaseKeys(data), value => isObject(value) ? JSON.stringify(value) : value);
}

const createEnqueue = messageQueue => {
  return async function (options = {}) {
    // Create timestamp
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const { value: data, error } = validateEnqueueOptions(options, now);

    if (error) {
      throw error;
    }

    // Create DB data row - snake case keys and stringify objects/arrays
    const row = formatRowData(data);

    // Determine notify key
    const template = await getTemplate(data.messageRef);
    const apiKey = getNotifyKey(template.notify_key);

    // Generate message preview with Notify
    try {
      const notifyClient = new NotifyClient(apiKey);
      const result = await notifyClient.previewTemplateById(template.template_id, data.personalisation);
      row.plaintext = result.body.body;
      row.message_type = result.body.type;
    } catch (err) {
      if (err.statusCode === 400) {
        throw err;
      } else {
        console.log(err);
      }
    }

    // Write data row to DB
    await writeScheduledNotificationRow(row);
    const startIn = scheduleSendEvent(messageQueue, row, now);

    // Return row data
    return { data: row, startIn };
  };
};

const createRegisterSubscribers = messageQueue => {
  return () => {
    messageQueue.subscribe('notify.send', async (job, done) => {
      const { id } = job.data;

      try {
        const { data } = await send(id);

        // Schedule status checks
        messageQueue.publish('notify.status', data);
        messageQueue.publish('notify.status', data, { startIn: 60 });
        messageQueue.publish('notify.status', data, { startIn: 3600 });
        messageQueue.publish('notify.status', data, { startIn: 86400 });
        messageQueue.publish('notify.status', data, { startIn: 259200 });
      } catch (err) {
        console.error(err);
      }

      done();
    });

    messageQueue.subscribe('notify.status', async (job, done) => {
      const { id } = job.data;
      await updateMessageStatus(id);
      done();
    });
  };
};

module.exports = (messageQueue) => {
  return {
    enqueue: createEnqueue(messageQueue),
    registerSubscribers: createRegisterSubscribers(messageQueue)
  };
};
