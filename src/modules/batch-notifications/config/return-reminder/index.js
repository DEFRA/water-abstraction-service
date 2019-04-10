const Joi = require('joi');

const { get, set, isArray, isObject, mapValues, uniq } = require('lodash');

const returnsConnector = require('../../../../lib/connectors/returns');
const permitConnector = require('../../../../lib/connectors/permit');
const { createContacts } = require('../../../../lib/models/factory/contact-list');
const { CONTACT_ROLE_LICENCE_HOLDER, CONTACT_ROLE_RETURNS_TO } =
  require('../../../../lib/models/contact');
const { createNotificationData } = require('./create-notification-data');
const scheduledNotifications = require('../../../../controllers/notifications');
const evt = require('../../../../lib/event');
const { EVENT_STATUS_PROCESSED } = require('../../lib/event-statuses');

const schema = {
  endDate: Joi.string().isoDate().required(),
  excludeLicences: Joi.string()
};

const getExcludeLicences = data => {
  const csv = get(data, 'ev.metadata.options.excludeLicences', '');
  return csv.split(',').map(x => x.trim()).filter(x => x);
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
 * Stringifies array/object data for writing to DB
 * @param  {Object} data - row data
 * @return {Object}      - row data with arrays/objects stringified
 */
const prepareDBRow = data => {
  return mapValues(data, (value, key) => {
    if (isArray(value) || isObject(value)) {
      return JSON.stringify(value);
    }
    return value;
  });
};

/**
 * Marks event as processed, and also updates the number of messages,
 * licence numbers etc.
 * @param  {String}  eventId - the event ID GUID
 * @param  {Array}  returns - list of returns for this notification
 * @return {Promise}         resolves when event updated
 */
const markEventAsProcessed = async (eventId, returns) => {
  const licenceNumbers = uniq(returns.map(row => row.licence_ref));
  const ev = await evt.load(eventId);

  set(ev, 'status', EVENT_STATUS_PROCESSED);
  set(ev, 'licences', licenceNumbers);
  set(ev, 'metadata.sent', 0);
  set(ev, 'metadata.error', 0);
  set(ev, 'metadata.recipients', returns.length);

  return evt.save(ev);
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

  for (let ret of returns) {
    // Get licence data so contacts can be extracted
    const licenceData = await permitConnector.licences.getWaterLicence(ret.licence_ref);

    // Get contact for message
    const contacts = createContacts(licenceData.licence_data_value);
    const contact = getPreferredContact(contacts);

    // Create and persist scheduled_notifications data
    const scheduledNotification = createNotificationData(data.ev, ret, contact);
    const rowData = prepareDBRow(scheduledNotification);
    await scheduledNotifications.repository.create(rowData);
  }

  // Update event status
  return markEventAsProcessed(data.ev.eventId, returns);
};

module.exports = {
  prefix: 'RREM-',
  name: 'Returns: reminder',
  messageType: 'returnReminder',
  schema,
  getRecipients
};
