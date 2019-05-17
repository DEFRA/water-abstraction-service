const { get } = require('lodash');
const { logger } = require('../../../../logger');
const messageHelpers = require('../message-helpers');
const { createJobPublisher } = require('../batch-notifications');
const notify = require('../notify-connector');

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
const publishSendMessage = createJobPublisher(JOB_NAME, 'messageId', true);

/**
 * Sends a single message
 * @param  {Object}  job - job data
 * @return {Promise}     - resolves when message sent
 */
const handleSendMessage = async job => {
  const messageId = get(job, 'data.messageId');

  try {
    // load scheduled notification data from table
    const message = await messageHelpers.getMessageById(messageId);
    const notifyResponse = await notify.send(message);
    await messageHelpers.markMessageAsSent(messageId, notifyResponse);
  } catch (err) {
    logger.error(`Error sending batch message`, err, { messageId });
    await messageHelpers.markMessageAsErrored(messageId, err);
  }
};

exports.publish = publishSendMessage;
exports.handler = handleSendMessage;
exports.jobName = JOB_NAME;
