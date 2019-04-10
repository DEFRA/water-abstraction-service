const { get } = require('lodash');
const messageQueue = require('../../../../lib/message-queue');
const { logger } = require('@envage/water-abstraction-helpers');
const eventHelpers = require('../event-helpers');

/**
 * The name of this event in the PG Boss
 * @type {String}
 */
const JOB_NAME = 'notifications.refreshEvent';

/**
 * Publishes refresh event job.
 * @TODO include singleton key
 * @param  {String} eventId - GUID in scheduled_notification table
 * @return {Promise}           resolves when message published
 */
const publishRefreshEvent = eventId => {
  const data = { eventId };
  const options = {
    singletonKey: eventId
  };
  return messageQueue.publish(JOB_NAME, data, options);
};

/**
 * Sends a single message
 * @param  {Object}  job - job data
 * @return {Promise}     - resolves when message sent
 */
const handleRefreshEvent = async job => {
  const eventId = get(job, 'data.eventId');
  try {
    await eventHelpers.refreshEventStatus(eventId);
  } catch (err) {
    logger.error(`Error refreshing batch message event`, err, { eventId });
  }
};

exports.publish = publishRefreshEvent;
exports.handler = handleRefreshEvent;
exports.jobName = JOB_NAME;
