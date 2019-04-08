const { get } = require('lodash');
const messageQueue = require('../../../../lib/message-queue');
const batchNotifications = require('../batch-notifications');
const { logger } = require('@envage/water-abstraction-helpers');

/**
 * The name of this event in the PG Boss
 * @type {String}
 */
const JOB_NAME = 'notifications.getRecipients';

const publishGetRecipients = eventId => {
  messageQueue.publish(JOB_NAME, batchNotifications.buildJobData(eventId));
};

const handleGetRecipients = async job => {
  const eventId = get(job, 'data.eventId');

  try {
    const data = await batchNotifications.loadJobData(eventId);

    // Use config.getRecipients to get recipient list for this notification
    const contacts = await data.config.getRecipients(data);
  } catch (err) {
    logger.error(`Batch notifications handleGetRecipients error:`, err, { eventId });
  }
};

exports.publish = publishGetRecipients;
exports.handler = handleGetRecipients;
exports.jobName = JOB_NAME;
