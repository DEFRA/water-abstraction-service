const Joi = require('joi');

const { get, uniq, groupBy } = require('lodash');

const returnsConnector = require('../../../../lib/connectors/returns');
const permitConnector = require('../../../../lib/connectors/permit');
const { createContacts } = require('../../../../lib/models/factory/contact-list');
const { CONTACT_ROLE_LICENCE_HOLDER } =
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
  return contactList.getByRole(CONTACT_ROLE_LICENCE_HOLDER);
};

const getRecipientsFromReturns = async returns => {
  const recipients = [];
  for (let ret of returns) {
    // Get licence data so contacts can be extracted
    const licenceData = await permitConnector.licences.getWaterLicence(ret.licence_ref);

    // Get contact for message
    const contacts = createContacts(licenceData.licence_data_value);
    const contact = getPreferredContact(contacts);

    if (contact) {
      recipients.push({
        contact,
        return: ret
      });
    } else {
      logger.error(`Return reminder: no contacts for ${ret.licence_ref}`);
    }
  }
  return recipients;
};

const getLicenceNumbers = deduped => {
  return Object.values(deduped).reduce((acc, group) => {
    const licenceNumbers = group.map(row => row.return.licence_ref);
    return [...acc, ...licenceNumbers];
  }, []);
};

const getRecipientCount = deduped => Object.values(deduped).length;

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

  // Get recipients
  const recipients = await getRecipientsFromReturns(returns);

  // De-duplicate on contact
  const deduped = groupBy(recipients, recipient => recipient.contact.generateId());

  for (let group of Object.values(deduped)) {
    // Create and persist scheduled_notifications data
    const scheduledNotification = createNotificationData(data.ev, group);
    const rowData = stringifyValues(scheduledNotification);
    await scheduledNotifications.repository.create(rowData);
  }

  const licenceNumbers = getLicenceNumbers(deduped);
  const count = getRecipientCount(deduped);

  // Update event status
  return eventHelpers.markAsProcessed(data.ev.eventId, licenceNumbers, count);
};

module.exports = {
  prefix: 'RINV-',
  name: 'Returns: invitation',
  messageType: 'returnInvitation',
  schema,
  getRecipients,
  notifyTemplate: {
    letter: 'd31d05d3-66fe-4203-8626-22e63f9bccd6'
  }
};
