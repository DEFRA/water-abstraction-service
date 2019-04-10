const uuidv4 = require('uuid/v4');
const snakeCase = require('snake-case');
const { get } = require('lodash');
const { STATUS_DRAFT } = require('../../lib/message-statuses');

const getPurposeDescription = purpose => get(purpose, 'tertiary.description');

const getPurposeString = ret => {
  const purposes = get(ret, 'metadata.purposes', []).map(getPurposeDescription);
  return purposes.join(', ');
};

const createNotificationPersonalisation = (ev, ret, contact) => {
  return {
    name: contact.name,
    role: snakeCase(contact.role.toLowerCase()),
    town: contact.town,
    email: null,
    county: contact.county,
    qr_url: ret.return_id,
    source: ret.source,
    country: contact.country,
    purpose: getPurposeString(ret),
    due_date: ret.due_date,
    end_date: ret.end_date,
    forename: contact.firstName,
    initials: contact.initials,
    postcode: contact.postcode,
    area_code: get(ret, 'metadata.nald.areaCode'),
    format_id: ret.return_requirement,
    salutation: contact.salutation,
    start_date: ret.start_date,
    licence_ref: ret.licence_ref,
    region_code: get(ret, 'metadata.nald.regionCode'),
    address_line_1: contact.addressLine1,
    address_line_2: contact.addressLine2,
    address_line_3: contact.addressLine3,
    address_line_4: contact.addressLine4,
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
    status: STATUS_DRAFT,
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
