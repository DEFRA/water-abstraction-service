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
const Joi = require('joi');
const snakeCaseKeys = require('snakecase-keys');
const { createGUID } = require('../../lib/helpers');
const { getTemplate, getNotifyKey, sendMessage } = require('./helpers');
const scheduledNotification = require('../../controllers/notifications').repository;
const { NotificationNotFoundError, NotifyIdError } = require('./errors');
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

  const { personalisation, message_ref: messageRef, recipient } = data;

  // Load template from notify_templates table
  const notifyTemplate = await getTemplate(messageRef);

  // Send message with Notify API
  try {
    const { body: notifyResponse } = await sendMessage(notifyTemplate, personalisation, recipient);

    // Update plaintext value with what Notify actually sent
    try {
      await scheduledNotification.update({ id }, {
        status: 'sent',
        notify_id: notifyResponse.id,
        plaintext: notifyResponse.content.body
      });
    } catch (err) {
      console.error(err);
    }

    return {
      error: null,
      data
    };
  } catch (error) {
    await scheduledNotification.update({ id }, {
      status: 'error',
      log: JSON.stringify({ error: 'Notify error', message: error.toString() })
    });

    return { error };
  }
}

module.exports = (messageQueue) => {
  /**
   * Queues a message to be sent
   * @param {Object} options
   * @return {Promise}
   */
  async function enqueue (options = {}) {
    // Create timestamp
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    // Validate input options
    const schema = {
      id: Joi.string().default(createGUID()),
      messageRef: Joi.string(),
      recipient: Joi.string().default('n/a'),
      personalisation: Joi.object(),
      sendAfter: Joi.string().default(now),
      licences: Joi.array().items(Joi.string()).default([]),
      individualEntityId: [Joi.allow(null), Joi.string().guid()],
      companyEntityId: [Joi.allow(null), Joi.string().guid()],
      eventId: Joi.string().guid(),
      metadata: Joi.object().default({})
    };

    const { value: data, error } = Joi.validate(options, schema);

    if (error) {
      throw error;
    }

    // Create DB data row - snake case keys and stringify objects/arrays
    const row = mapValues(snakeCaseKeys(data), value => isObject(value) ? JSON.stringify(value) : value);

    console.log('Options', options);
    console.log('Validated', data);
    console.log('Row data', row);

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
    const { error: dbError } = await scheduledNotification.create(row);
    if (dbError) {
      console.error(dbError);
      throw dbError;
    }

    // Schedule send event
    const startIn = Math.round(moment(row.send_after).diff(moment(now)) / 1000);
    messageQueue.publish('notify.send', row, {
      startIn
    });

    // Return row data
    return { data: row, startIn };
  }

  /**
   * Register subscribers with the message queue.
   * This must be done after messageQueue.start() has resolved
   */
  function registerSubscribers () {
    messageQueue.subscribe('notify.send', async (job, done) => {
      const { id } = job.data;

      const { data, error } = await send(id);

      // Schedule status checks
      if (!error) {
        messageQueue.publish('notify.status', data);
        messageQueue.publish('notify.status', data, { startIn: 60 });
        messageQueue.publish('notify.status', data, { startIn: 3600 });
        messageQueue.publish('notify.status', data, { startIn: 86400 });
      }

      done();
    });

    messageQueue.subscribe('notify.status', async (job, done) => {
      const { id } = job.data;
      await updateMessageStatus(id);
      done();
    });
  }

  return {
    enqueue,
    registerSubscribers
  };
};
