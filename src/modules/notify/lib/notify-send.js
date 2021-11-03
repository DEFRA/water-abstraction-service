const { logger } = require('../../../logger');
const promiseRetry = require('promise-retry');
const scheduledNotificationConnector = require('../connectors/scheduled-notification');
const { AlreadySentError } = require('../../../lib/notify/errors');
const helpers = require('../lib/helpers');
const notify = require('../../../lib/notify');
const notifyTemplateConnector = require('../connectors/notify-template');
const { HIGH_PRIORITY } = require('../../../lib/priorities');

const JOB_NAME = 'notify.send';

/**
 * Creates a message for Bull MQ
 * @param {Object} data containing id
 * @param {Object} options containing message options
 * @returns {Object}
 */
const createMessage = (data, options = {}) => {
  logger.info(`Create Message ${JOB_NAME}`);
  const {
    singletonKey,
    priority = HIGH_PRIORITY // default to High
  } = options;
  return [
    JOB_NAME,
    data,
    {
      jobId: `${JOB_NAME}${singletonKey ? ':' + singletonKey : ''}`,
      priority
    }
  ];
};

/**
 * Send notificatation message by scheduled_notification ID
 * @param {String} id - water.scheduled_notification id
 * @return {Promise} resolves with { data, notifyResponse }
 */
const send = async id => {
  // Get scheduled notification record
  const data = await scheduledNotificationConnector.findById(id);

  if (data.status === 'sent') {
    throw new AlreadySentError(`Message ${id} already sent, aborting`);
  }

  const { personalisation, message_ref: messageRef, recipient } = data;

  try {
    let notifyResponse;

    if (helpers.isPdf(messageRef)) {
      // Render and send PDF message
      const notifyId = `${personalisation.address_line_1} ${personalisation.postcode} ${id}`;
      notifyResponse = await notify.sendPdf(id, notifyId);
    } else {
      // Load template from notify_templates table
      const notifyTemplate = await notifyTemplateConnector.findByMessageRef(messageRef);
      notifyResponse = await notify.send(notifyTemplate, personalisation, recipient);
    }

    await scheduledNotificationConnector.scheduledNotification.update({ id }, helpers.parseSentResponse(notifyResponse));
  } catch (error) {
    // Log notify error
    await scheduledNotificationConnector.scheduledNotification.update({ id }, {
      status: 'error',
      log: JSON.stringify({ error: 'Notify error', message: error.toString() })
    });

    throw error;
  }

  return data;
};

/**
 * Wraps the send function and automatically tries resending the message
 * @param  {String} id - scheduled_notification ID
 * @return {Promise}    resolves when message sent
 */
const sendAndRetry = async id => {
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
};

const handleNotifySend = async job => {
  logger.info(`Handling: ${JOB_NAME}:${job.id}`);
  const { id } = job.data;

  try {
    await sendAndRetry(id);
  } catch (err) {
    logger.error('Failed to send', err);
    throw err;
  }
};

const onComplete = async () => logger.info(`${JOB_NAME}: Job has completed`);

const onFailed = async (job, err) => logger.error(`${JOB_NAME}: Job has failed`, err);

exports.send = send;
exports.createMessage = createMessage;
exports.handler = handleNotifySend;
exports.onFailed = onFailed;
exports.onComplete = onComplete;
exports.jobName = JOB_NAME;
