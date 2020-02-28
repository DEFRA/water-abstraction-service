const { get, uniq } = require('lodash');

const { stringifyValues } = require('../../../../../lib/stringify-values');

const { createNotificationData } = require('./create-notification-data');
const scheduledNotifications = require('../../../../../controllers/notifications');
const { logger } = require('../../../../../logger');
const eventHelpers = require('../../../lib/event-helpers');
const notificationContacts = require('./return-notification-contacts');
const notificationRecipients = require('./return-notification-recipients');

/**
 * Gets array of licences to exclude from event metadata
 * @param  {Object} job - PG boss job data
 * @return {[type]}      [description]
 */
const getExcludeLicences = job => {
  const licenceNumbers = get(job, 'ev.metadata.options.excludeLicences', []);
  return uniq(licenceNumbers);
};

/**
 * A function to get a list of recipients for the requested message, and
 * persist them to the scheduled_notifications table
 * @param  {Object}  data - PG boss event data
 * @return {Promise}
 */
const getRecipients = async (data) => {
  const excludeLicences = getExcludeLicences(data);

  // Get a list of returns grouped by licence number
  const returnContacts = await notificationContacts
    .getReturnContacts(excludeLicences);

  // Get a list of recipients from the grouped returns
  const messages = notificationRecipients.getRecipientList(returnContacts);

  const licenceNumbers = [];
  let recipientCount = 0;

  for (const message of messages) {
    const { contact, ...context } = message;

    if (contact) {
      const scheduledNotification = await createNotificationData(data.ev, contact, context);
      const rowData = stringifyValues(scheduledNotification);
      await scheduledNotifications.repository.create(rowData);

      recipientCount++;
      licenceNumbers.push(...context.licenceNumbers);
    } else {
      const name = get(data, 'ev.metadata.name', 'Returns notification');
      logger.error(`${name} - no contact found for ${context.returnIds.join(', ')}`);
    }
  }

  // Update event status
  return eventHelpers.markAsProcessed(data.ev.eventId, licenceNumbers, recipientCount);
};

exports.getRecipients = getRecipients;
