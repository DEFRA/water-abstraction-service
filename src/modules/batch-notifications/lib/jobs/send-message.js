const { get } = require('lodash');
const messageQueue = require('../../../../lib/message-queue');
const { logger } = require('@envage/water-abstraction-helpers');
const notify = require('../../../notify/connectors/notify');
const messageHelpers = require('../message-helpers');

/**
 * The name of this event in the PG Boss
 * @type {String}
 */
const JOB_NAME = 'notifications.sendMessage';

/**
 * Publishes send message job
 * @param  {String} messageId - GUID in scheduled_notification table
 * @return {Promise}           resolves when message published
 */
const publishSendMessage = messageId => {
  const data = { messageId };
  const options = {
    singletonKey: messageId
  };
  return messageQueue.publish(JOB_NAME, data, options);
};

/**
 * Creates a string reference for a message in Notify so it can be
 * easily identified in the Notify UI
 * @param  {Object} message - row from scheduled_notification table
 * @return {String}           notification reference
 */
const createNotifyReference = (message) => {
  const id = get(message, 'id');
  const addressLine1 = get(message, 'personalisation.address_line_1');
  const postcode = get(message, 'personalisation.postcode');
  return `${addressLine1} ${postcode} ${id}`;
};

/**
 * Sends a single message
 * @param  {Object}  job - job data
 * @return {Promise}     - resolves when message sent
 */
const handleSendMessage = async job => {
  const messageId = get(job, 'data.messageId');

  // load scheduled notification data from table
  const message = await messageHelpers.getMessageById(messageId);

  const notifyReference = createNotifyReference(message);

  try {
    // @TODO this will need modification to handle non-PDF message types
    const notifyResponse = await notify.sendPdf(messageId, notifyReference);
    await messageHelpers.markMessageAsSent(messageId, notifyResponse);
  } catch (err) {
    logger.error(`Error sending batch message`, err, { messageId });
    await messageHelpers.markMessageAsErrored(messageId, err);
  }
};

exports.publish = publishSendMessage;
exports.handler = handleSendMessage;
exports.jobName = JOB_NAME;
