/**
 * Notify flow:
 * - enqueue - adds record in scheduled_notification table, fire 'send' now or in future
 * - send - sends notify message, fire 'status' at several regular intervals in future
 * - status - checks status in notify, updates scheduled_notification table
 */
const Boom = require('@hapi/boom');
const moment = require('moment');
const promiseRetry = require('promise-retry');
const notify = require('../../lib/notify');
const { validateEnqueueOptions, isPdf, parseSentResponse } = require('./lib/helpers');
const { scheduledNotification, findById, createFromObject } = require('./connectors/scheduled-notification');
const { findByMessageRef } = require('./connectors/notify-template');
const { AlreadySentError } = require('../../lib/notify/errors');
const { HIGH_PRIORITY, LOW_PRIORITY } = require('../../lib/priorities');
const { logger } = require('../../logger');

/**
 * Send notificatation message by scheduled_notification ID
 * @param {String} id - water.scheduled_notification id
 * @return {Promise} resolves with { data, notifyResponse }
 */
async function send (id) {
  // Get scheduled notification record
  const data = await findById(id);

  if (data.status === 'sent') {
    throw new AlreadySentError(`Message ${id} already sent, aborting`);
  }

  const { personalisation, message_ref: messageRef, recipient } = data;

  try {
    let notifyResponse;

    if (isPdf(messageRef)) {
      // Render and send PDF message
      const notifyId = `${personalisation.address_line_1} ${personalisation.postcode} ${id}`;
      notifyResponse = await notify.sendPdf(id, notifyId);
    } else {
      // Load template from notify_templates table
      const notifyTemplate = await findByMessageRef(messageRef);
      notifyResponse = await notify.send(notifyTemplate, personalisation, recipient);
    }

    await scheduledNotification.update({ id }, parseSentResponse(notifyResponse));
  } catch (error) {
    // Log notify error
    await scheduledNotification.update({ id }, {
      status: 'error',
      log: JSON.stringify({ error: 'Notify error', message: error.toString() })
    });

    throw error;
  }

  return data;
}

/**
 * Wraps the send function and automatically tries resending the message
 * @param  {String} id - scheduled_notification ID
 * @return {Promise}    resolves when message sent
 */
async function sendAndRetry (id) {
  const options = {
    retries: 5,
    factor: 3,
    minTimeout: 10 * 1000,
    randomize: true
  };

  const func = (retry, number) => {
    logger.log('info', `Sending message ${id} attempt ${number}`);
    return send(id)
      .catch(retry);
  };

  return promiseRetry(func, options);
}

/**
 * @param {Object} messageQueue - PG boss instance
 * @param {Object} row - row data
 * @param {String} ISO 8601 timestamp
 * @return {Number} number of seconds until event starts
 */
async function scheduleSendEvent (messageQueue, row, now) {
  // Give email/SMS higher priority than letter
  const priority = row.message_type === 'letter' ? LOW_PRIORITY : HIGH_PRIORITY;

  // Schedule send event
  const startIn = Math.round(moment(row.send_after).diff(moment(now)) / 1000);

  const options = {
    startAfter: row.send_after,
    singletonKey: row.id,
    priority,
    expireIn: '1 day'
  };

  await messageQueue.publish('notify.send', row, options);
  return startIn;
}

/**
 * For messages which use a Notify template, this function
 * gets the appropriate Notify key and creates message preview
 */
const getNotifyPreview = async (data) => {
  // Determine notify key/template ID and generate preview
  const template = await findByMessageRef(data.messageRef);
  const { body: { body: plaintext, type } } = await notify.preview(template, data.personalisation);

  return {
    ...data,
    plaintext,
    messageType: type
  };
};

/**
 * Queues a message ready for sending.  For standard Notify message
 * a preview is generated and stored in scheduled_notification table
 * For PDF messages, this does not happen
 */
const createEnqueue = messageQueue => {
  return async function (options = {}) {
    // Create timestamp
    const now = moment().format('YYYY-MM-DD HH:mm:ss');

    const { value: data, error } = validateEnqueueOptions(options, now);

    if (error) {
      throw Boom.badRequest('Invalid message enqueue options', error);
    }

    // For non-PDF  messages, generate preview and add to data
    const row = isPdf(options.messageRef) ? data : await getNotifyPreview(data);

    // Persist row to scheduled_notification table
    const dbRow = await createFromObject(row);

    // Schedules send event
    const startIn = await scheduleSendEvent(messageQueue, dbRow, now);

    // Return row data
    return { data: dbRow, startIn };
  };
};

const registerSendSubscriber = messageQueue => {
  messageQueue.subscribe('notify.send', async (job, done) => {
    const { id } = job.data;

    try {
      await sendAndRetry(id);
    } catch (err) {
      logger.error('Failed to send', err);
      throw err;
    }
  });
};

const createRegisterSubscribers = messageQueue => {
  return () => {
    registerSendSubscriber(messageQueue);
  };
};

module.exports = (messageQueue) => {
  const enqueue = createEnqueue(messageQueue);
  const registerSubscribers = createRegisterSubscribers(messageQueue);

  return {
    enqueue,
    registerSubscribers
  };
};
