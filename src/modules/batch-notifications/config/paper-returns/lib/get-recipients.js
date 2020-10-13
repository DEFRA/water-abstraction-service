'use strict';

const returnsService = require('../../../../../lib/services/returns/api-connector');
const ScheduledNotification = require('../../../../../lib/models/scheduled-notification');
const scheduledNotificationService = require('../../../../../lib/services/scheduled-notifications');
const { COMPANY_TYPES } = require('../../../../../lib/models/company');

const getContactPersonalisation = (company, contact) => {
  if (company.type === COMPANY_TYPES.organisation) {
    return { name: company.name };
  }

  return {
    salutation: contact.title,
    forename: contact.firstName,
    initials: contact.initials,
    name: contact.lastName
  };
};

const getAddressPersonalisation = address => ({
  address_line_1: address.addressLine1,
  address_line_2: address.addressLine2,
  address_line_3: address.addressLine3,
  address_line_4: address.addressLine4,
  county: address.county,
  country: address.country,
  postcode: address.postcode,
  town: address.town
});

const getReturnPersonalisation = ret => {
  const metadata = ret.metadata || {};
  const nald = metadata.nald || {};

  return {
    area_code: nald.areaCode,
    due_date: ret.due_date,
    end_date: ret.end_date,
    format_id: nald.formatId,
    is_two_part_tariff: metadata.isTwoPartTariff,
    licence_ref: ret.licence_ref,
    purpose: metadata.purposes.map(p => p.tertiary.description).join(', '),
    qr_url: ret.return_id,
    region_code: nald.regionCode,
    returns_frequency: ret.returns_frequency,
    site_description: metadata.description,
    start_date: ret.start_date
  };
};

const getPersonalisationsForReturn = (company, address, contact, ret) => {
  return {
    ...getContactPersonalisation(company, contact),
    ...getAddressPersonalisation(address),
    ...getReturnPersonalisation(ret)
  };
};

const getPersonalisationsForForm = async form => {
  const personalisations = [];
  const { company, address, contact, returns } = form;
  const returnIds = returns.map(ret => ret.returnId);

  for (const returnId of returnIds) {
    const fullReturn = await returnsService.getReturnById(returnId);
    const personalisation = getPersonalisationsForReturn(company, address, contact, fullReturn);

    personalisations.push(personalisation);
  }

  return personalisations;
};

const getRecipients = async (eventData) => {
  // the event data was written to the events table by the
  // createEvent function of the config object. Therefore the
  // data that was included in the post body is found at
  // eventData.ev.metadata.options and will have the shape:
  // {
  //   forms: [
  //     {
  //       company: {},
  //       address: {},
  //       contact: {},
  //       returns: [{ returnId: "" }]
  //     }
  //   ]
  // }
  //
  // so for each of the returns a scheduled notification is created
  // containing the personalisation object that will allow the form
  // to be rendered.
  const event = eventData.ev;
  const { forms } = event.metadata.options;

  for (const form of forms) {
    const personalisations = await getPersonalisationsForForm(form);

    for (const personalisation of personalisations) {
      const notification = new ScheduledNotification();
      notification.personalisation = personalisation;
      notification.messageRef = 'pdf.return_form';
      notification.messageType = 'letter';
      notification.eventId = event.id;

      await scheduledNotificationService.createScheduledNotification(notification);
    }
  }
};

exports.getRecipients = getRecipients;
