const Joi = require('joi');

const { get, uniq } = require('lodash');

const returnsConnector = require('../../../../lib/connectors/returns');
const permitConnector = require('../../../../lib/connectors/permit');
const { createContacts } = require('../../../../lib/models/factory/contact-list');
const { CONTACT_ROLE_LICENCE_HOLDER, CONTACT_ROLE_RETURNS_TO } =
  require('../../../../lib/models/contact');
const { createNotificationData } = require('./create-notification-data');
const scheduledNotifications = require('../../../../controllers/notifications');
const { logger } = require('@envage/water-abstraction-helpers');
const eventHelpers = require('../../lib/event-helpers');
const { stringifyValues } = require('../../../../lib/stringify-values');

const schema = {
  excludeLicences: Joi.array().items(Joi.string().trim())
};

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
 * Given a ContactList object, gets the preferred contact for this message type
 * This is the returns_to contact if this exists, defaulting to the licence
 * holder
 * @param  {ContactList} contactList
 * @return {Contact}
 */
const getPreferredContact = contactList => {
  const returnsContact = contactList.getByRole(CONTACT_ROLE_RETURNS_TO);
  const licenceHolder = contactList.getByRole(CONTACT_ROLE_LICENCE_HOLDER);
  return returnsContact || licenceHolder;
};

/**
 * A function to get a list of recipients for the requested message, and
 * persist them to the scheduled_notifications table
 * @param  {Object}  data - PG boss event data
 * @return {Promise}
 */
const getRecipients = async (data) => {
  const excludeLicences = getExcludeLicences(data);

  // Load due returns in current cycle from return service
  const returns = await returnsConnector.getCurrentDueReturns(excludeLicences);

  let recipientCount = 0;
  const licenceNumbers = [];

  for (let ret of returns) {
    // Get licence data so contacts can be extracted
    const licenceData = await permitConnector.licences.getWaterLicence(ret.licence_ref);

    // Get contact for message
    const contacts = createContacts(licenceData.licence_data_value);
    const contact = getPreferredContact(contacts);

    if (contact) {
      // Create and persist scheduled_notifications data
      const scheduledNotification = createNotificationData(data.ev, ret, contact);
      const rowData = stringifyValues(scheduledNotification);
      await scheduledNotifications.repository.create(rowData);

      recipientCount++;
      licenceNumbers.push(ret.licence_ref);
    } else {
      logger.error(`Return reminder: no contacts for ${ret.licence_ref}`);
    }
  }

  // Update event status
  return eventHelpers.markAsProcessed(data.ev.eventId, licenceNumbers, recipientCount);
};

module.exports = {
  prefix: 'RREM-',
  name: 'Returns: reminder',
  messageType: 'returnReminder',
  schema,
  getRecipients
};
