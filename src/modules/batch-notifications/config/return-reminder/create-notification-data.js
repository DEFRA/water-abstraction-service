const uuidv4 = require('uuid/v4');
const snakeCase = require('snake-case');
const { get } = require('lodash');
const { MESSAGE_STATUS_DRAFT } = require('../../lib/message-statuses');

const getPurposeDescription = purpose => get(purpose, 'tertiary.description');

const getPurposeString = ret => {
  const purposes = get(ret, 'metadata.purposes', []).map(getPurposeDescription);
  return purposes.join(', ');
};

/**
 * Creates the notification address in the format expected by existing
 * notifications for the supplied Contact model
 * @param  {Contact} contact
 * @return {Object} contact details object for personalisation
 */
const createNotificationAddress = (contact) => ({
  salutation: contact.salutation,
  forename: contact.firstName,
  initials: contact.initials,
  name: contact.name,
  address_line_1: contact.addressLine1,
  address_line_2: contact.addressLine2,
  address_line_3: contact.addressLine3,
  address_line_4: contact.addressLine4,
  town: contact.town,
  county: contact.county,
  postcode: contact.postcode,
  country: contact.country
});

/**
 * Creates personalisation object to create notification - this includes the
 * address and other data needed by the template
 * @param  {Object} ev      - event object from water.events table
 * @param  {Object} ret     - return row loaded from returns service
 * @param  {Contact} contact - contact model
 * @return {Object}         personalisation data to send to Notify
 */
const createNotificationPersonalisation = (ev, ret, contact) => {
  return {
    role: snakeCase(contact.role.toLowerCase()),
    email: null,
    ...createNotificationAddress(contact),
    qr_url: ret.return_id,
    source: ret.source,
    purpose: getPurposeString(ret),
    due_date: ret.due_date,
    end_date: ret.end_date,
    area_code: get(ret, 'metadata.nald.areaCode'),
    format_id: ret.return_requirement,
    start_date: ret.start_date,
    licence_ref: ret.licence_ref,
    region_code: get(ret, 'metadata.nald.regionCode'),
    site_description: get(ret, 'metadata.description'),
    returns_frequency: ret.returns_frequency,
    is_two_part_tariff: get(ret, 'metadata.isTwoPartTariff')
  };
};

const createNotificationData = (ev, ret, contact) => {
  return {
    id: uuidv4(),
    recipient: 'n/a',
    message_type: 'letter',
    message_ref: 'pdf.return_reminder',
    personalisation: createNotificationPersonalisation(ev, ret, contact),
    status: MESSAGE_STATUS_DRAFT,
    licences: [ret.licence_ref],
    event_id: ev.eventId,
    metadata: {
      return_id: ret.return_id
    }
  };
};

module.exports = {
  createNotificationData
};
