/**
 * Notify flow:
 * - enqueue - adds record in scheduled_notification table, fire 'send' now or in future
 * - send - sends notify message, fire 'status' at several regular intervals in future
 * - status - checks status in notify, updates scheduled_notification table
 */
const Boom = require('boom');
const moment = require('moment');
const { get } = require('lodash');
const notify = require('./connectors/notify');
const { validateEnqueueOptions, isPdf, parseSentResponse } = require('./lib/helpers');
const { scheduledNotification, findById, createFromObject } = require('./connectors/scheduled-notification');
const { findByMessageRef } = require('./connectors/notify-template');
const { NotifyIdError, AlreadySentError } = require('./lib/errors');
const urlJoin = require('url-join');

/**
 * Updates the notify_status field for the message with the given ID
 * @param {String} id - water.scheduled_notification id
 */
async function updateMessageStatus (id) {
  const data = await findById(id);

  const { notify_id: notifyId } = data;

  if (!notifyId) {
    throw new NotifyIdError();
  }

  const status = await notify.getStatus(notifyId);

  return scheduledNotification.update({ id }, { notify_status: status });
}

/**
 * Send notificatation message by scheduled_notification ID
 * @param {String} id - water.scheduled_notification id
 * @return {Promise} resolves with { data, notifyResponse }
 */
async function send (id) {
  // Get scheduled notification record
  const data = await findById(id);

  if (data.status) {
    throw new AlreadySentError();
  }

  const { personalisation, message_ref: messageRef, recipient } = data;

  try {
    let notifyResponse;

    if (isPdf(messageRef)) {
      // Render and send PDF message
      const pdfContentUrl = urlJoin(process.env.WATER_URI_INTERNAL, `/pdf-notifications/render/${id}`);
      const notifyId = `${personalisation.address_line_1} ${personalisation.postcode} ${id}`;
      notifyResponse = await notify.sendPdf(pdfContentUrl, notifyId);
    } else {
      // Load template from notify_templates table
      const notifyTemplate = await findByMessageRef(messageRef);
      notifyResponse = await notify.send(notifyTemplate, personalisation, recipient);
    }

    await scheduledNotification.update({id}, parseSentResponse(notifyResponse));
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
      throw Boom.badRequest(`Invalid message enqueue options`, error);
    }

    // For non-PDF  messages, generate preview and add to data
    let row = isPdf(options.messageRef) ? data : await getNotifyPreview(data);

    // Persist row to scheduled_notification table
    const dbRow = await createFromObject(row);

    // Schedules send event
    const startIn = scheduleSendEvent(messageQueue, dbRow, now);

    // Return row data
    return { data: dbRow, startIn };
  };
};

const registerSendSubscriber = messageQueue => {
  messageQueue.subscribe('notify.send', async (job, done) => {
    const { id } = job.data;

    try {
      await send(id);
      return done();
    } catch (err) {
      console.error(err);
      return done(err);
    }
  });
};

const registerSendListener = messageQueue => {
  messageQueue.onComplete('notify.send', async (job) => {
    // Get scheduled_notification ID
    const id = get(job, 'data.request.data.id', null);

    // Schedule status checks
    for (let delay of [5, 60, 3600, 86400, 259200]) {
      await messageQueue.publish('notify.status', { id }, { startIn: delay });
    }
  });
};

const registerStatusCheckSubscriber = messageQueue => {
  messageQueue.subscribe('notify.status', async (job, done) => {
    const id = get(job, 'data.id');
    try {
      if (id) {
        await updateMessageStatus(id);
      }
    } catch (err) {
      console.error(err);
      return done(err);
    }

    return done();
  });
};

const createRegisterSubscribers = messageQueue => {
  return () => {
    registerSendSubscriber(messageQueue);
    registerSendListener(messageQueue);
    registerStatusCheckSubscriber(messageQueue);
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
