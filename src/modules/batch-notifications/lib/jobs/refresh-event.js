const { get } = require('lodash');
const { logger } = require('../../../../logger');
const eventHelpers = require('../event-helpers');
const { createJobPublisher } = require('../batch-notifications');

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
const publishRefreshEvent = createJobPublisher(JOB_NAME, 'eventId', true);

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
