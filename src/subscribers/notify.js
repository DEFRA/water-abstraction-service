/**
 * Notify flow:
 * - enqueue - adds record in scheduled_notification table, fire 'send' now or in future
 * - send - sends notify message, fire 'status' at several regular intervals in future
 * - status - checks status in notify, updates scheduled_notification table
 */
const notifyTemplateRepo = require('../controllers/notifytemplates').repository;
const scheduledNotification = require('../controllers/notifications').repository;
const NotifyClient = require('notifications-node-client').NotifyClient;
const moment = require('moment');
const { createGUID } = require('../lib/helpers');
const { mapValues } = require('lodash');

class TemplateNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'TemplateNotFoundError';
  }
}
class MessageTypeError extends Error {
  constructor (message) {
    super(message);
    this.name = 'MessageTypeError';
  }
}

/**
 * A function to get the notify key
 * The key stored in the DB can be an actual key, or it can refer
 * to an environment variable as follows:
 * test:  TEST_NOTIFY_KEY
 * whitelist: WHITELIST_NOTIFY_KEY
 * live: LIVE_NOTIFY_KEY
 * @param {String} a reference to a notify key: test|whitelist|live to be
 *                 loaded from environment variable, or a full key
 * @return {String} notify key
 */
function getNotifyKey (key) {
  const lKey = key.toLowerCase();
  const keys = {
    test: process.env.TEST_NOTIFY_KEY,
    whitelist: process.env.WHITELIST_NOTIFY_KEY,
    live: process.env.LIVE_NOTIFY_KEY
  };
  if (lKey in keys) {
    return keys[lKey];
  }
  return key;
}

/**
 * @param {Object} notifyTemplate - the data from the "water"."notify_templates" table
 * @param {Object} personalisation - personalisation of the notify template
 * @param {String} recipient - for SMS/email only
 */
async function sendMessage (notifyTemplate, personalisation, recipient) {
  const { notify_key: notifyKey, template_id: templateId } = notifyTemplate;

  // Get API key and create client
  const apiKey = getNotifyKey(notifyKey);
  const notifyClient = new NotifyClient(apiKey);

  // check template exists in notify
  const template = await notifyClient.getTemplateById(templateId);

  const { type } = template.body;

  switch (type) {
    case 'sms':
      return notifyClient.sendSms(templateId, recipient, personalisation);

    case 'email':
      return notifyClient.sendEmail(templateId, recipient, personalisation);

    case 'letter':
      return notifyClient.sendLetter(templateId, personalisation);

    default:
      throw new MessageTypeError(`Message type ${type} not found`);
  }
}

/**
 * Loads the notify template info from the DB
 * @param {String} messageRef
 * @return {Promise} resolves with object of notify template data
 */
async function getTemplate (messageRef) {
  // Load template
  const { error, rows: [notifyTemplate] } = await notifyTemplateRepo.find({ message_ref: messageRef });

  if (error) {
    throw error;
  }
  if (!notifyTemplate) {
    throw TemplateNotFoundError(`Template for message ${messageRef} not found`);
  }

  return notifyTemplate;
}

module.exports = (messageQueue) => {
  messageQueue.subscribe('notify.enqueue', async (job, done) => {
    console.log('notify.enqueue');

    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const {
      messageRef,
      recipient,
      personalisation,
      sendAfter = now,
      data = {}
    } = job.data;

    // Create row of data for scheduled_notification table
    const row = {
      ...data,
      id: createGUID(),
      recipient,
      message_ref: messageRef,
      personalisation,
      send_after: sendAfter || moment().format('YYYY-MM-DD HH:mm:ss')
    };

    // Stringify non-scalar values
    const dbRow = mapValues(row, value => typeof (value) === 'object' ? JSON.stringify(value) : value);

    const { error } = await scheduledNotification.create(dbRow);

    if (error) {
      console.error(error);
      throw error;
    }

    // Schedule send event
    const startIn = Math.round(moment(now).diff(moment(sendAfter)) / 1000);
    messageQueue.publish('notify.send', row, {
      startIn
    });

    done();
  });

  /**
   * Send notification
   */
  messageQueue.subscribe('notify.send', async (job, done) => {
    console.log('notify.send');
    console.log(job.data);

    const { message_ref: messageRef, personalisation, recipient } = job.data;

    // Send message, returning notify ID
    try {
      // Load template from notify_templates table
      const notifyTemplate = await getTemplate(messageRef);
      // Send message with Notify API
      const { body: notifyResponse } = await sendMessage(notifyTemplate, personalisation, recipient);

      const data = {
        ...job.data,
        notifyResponse
      };

      // Schedule update status events
      messageQueue.publish('notify.status', data);
      messageQueue.publish('notify.status', data, { startIn: 60 });
      messageQueue.publish('notify.status', data, { startIn: 3600 });
      messageQueue.publish('notify.status', data, { startIn: 86400 });
    } catch (error) {
      console.error(error);
      // @TODO log in DB
    }

    done();
  });

  /**
   * Update notify status from API
   */
  messageQueue.subscribe('notify.status', async (job, done) => {
    const { id, notifyResponse: { id: notifyId } } = job.data;

    console.log('notify.status', notifyId);

    const client = new NotifyClient(process.env.LIVE_NOTIFY_KEY);

    const { body: { status } } = await client.getNotificationById(notifyId);

    await scheduledNotification.update({ id }, { notify_status: status });

    done();
  });
};
