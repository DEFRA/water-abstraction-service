const { get } = require('lodash');
const batchNotifications = require('../batch-notifications');
const { logger } = require('../../../../logger');
const eventsService = require('../../../../lib/services/events');
const { EVENT_STATUS_ERROR } = require('../event-statuses');
const { createJobPublisher } = require('../batch-notifications');

/**
 * The name of this event in the PG Boss
 * @type {String}
 */
const JOB_NAME = 'notifications.getRecipients';

const publishGetRecipients = createJobPublisher(JOB_NAME, 'eventId', true);

const handleGetRecipients = async job => {
  const eventId = get(job, 'data.eventId');

  try {
    const data = await batchNotifications.loadJobData(eventId);

    // Use config.getRecipients to get recipient list for this notification
    await data.config.getRecipients(data);
  } catch (err) {
    logger.error('Batch notifications handleGetRecipients error:', err, { eventId });
    return eventsService.updateStatus(eventId, EVENT_STATUS_ERROR);
  }
};

exports.publish = publishGetRecipients;
exports.handler = handleGetRecipients;
exports.jobName = JOB_NAME;
