const { get } = require('lodash');
const { logger } = require('../../../../logger');
const { getNextCheckTime, getNextCheckCount } = require('../status-check-helpers');
const messageHelpers = require('../message-helpers');
const notify = require('../../../notify/connectors/notify');
const scheduledNotifications = require('../../../../controllers/notifications');
const { createJobPublisher } = require('../batch-notifications');

/**
 * The name of this event in the PG Boss
 * @type {String}
 */
const JOB_NAME = 'notifications.checkStatus';

/**
 * Publishes a status check job on the PG Boss queue
 * @param  {String} messageId - GUID of the scheduled_notification
 * @return {Promise}
 */
const publishCheckStatus = createJobPublisher(JOB_NAME, 'messageId');

/**
 * PG boss job handler to check the status of a scheduled_notification in
 * Notify and update the status in the local DB table
 * @param  {Object}  job - PG boss job data
 * @return {Promise}
 */
const handleCheckStatus = async job => {
  const messageId = get(job, 'data.messageId');

  try {
    // Load scheduled_notification message data
    const message = await messageHelpers.getMessageById(messageId);

    // Check message status from notify
    const status = await notify.getStatus(message.notify_id);

    // Update scheduled_notification with the next status check timestamp,
    // the number of status checks now performed, and the status retrieved
    // from the Notify API call
    const data = {
      next_status_check: getNextCheckTime(message),
      status_checks: getNextCheckCount(message),
      notify_status: status
    };

    return scheduledNotifications.repository.update({ id: messageId }, data);
  } catch (err) {
    logger.error(`Error checking notify status`, err, { messageId });
  }
};

exports.publish = publishCheckStatus;
exports.handler = handleCheckStatus;
exports.jobName = JOB_NAME;
