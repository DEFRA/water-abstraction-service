'use strict';

const { isEmpty, omit } = require('lodash');
const Contact = require('../models/contact-v2');

/**
 * Maps a row of CRM v2 contact data to a Contact instance
 * @param {Object} contactData
 * @return {Contact}
 */
const crmToModel = contact => {
  if (isEmpty(contact)) {
    return null;
  }
  const contactModel = new Contact(contact.contactId);
  contactModel.pickFrom(contact,
    ['firstName', 'initials', 'middleInitials', 'lastName', 'suffix', 'department', 'type', 'dataSource']);
  contactModel.title = contact.salutation || null;
  return contactModel;
};

const serviceToCrm = contactData => ({
  ...omit(contactData, 'title'),
  salutation: contactData.title || contactData.salutation
});

exports.crmToModel = crmToModel;
exports.serviceToCrm = serviceToCrm;
