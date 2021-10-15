'use strict';

const { get } = require('lodash');
const { logger } = require('../../../../logger');
const messageHelpers = require('../message-helpers');
const { createJobPublisher } = require('../batch-notifications');
const notify = require('../notify-connector');
const scheduledNotificationService = require('../../../../lib/services/scheduled-notifications');
const licenceGaugingStationConnector = require('../../../../lib/connectors/repos/licence-gauging-stations');

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
    const scheduledNotification = await scheduledNotificationService.getScheduledNotificationById(messageId);
    if (scheduledNotification.messageRef.indexOf('water_abstraction_alert') > -1) {
      // If this is a water abstraction alert, update the linkage record
      await licenceGaugingStationConnector.updateStatus(
        scheduledNotification.personalisation.licenceGaugingStationId,
        scheduledNotification.personalisation.sending_alert_type
      );
    }
    const notifyResponse = await notify.send(scheduledNotification);
    await scheduledNotificationService.updateScheduledNotificationWithNotifyResponse(messageId, notifyResponse);
  } catch (err) {
    logger.error('Error sending batch message', err, { messageId });
    await messageHelpers.markMessageAsErrored(messageId, err);
  }
};

exports.publish = publishSendMessage;
exports.handler = handleSendMessage;
exports.jobName = JOB_NAME;
