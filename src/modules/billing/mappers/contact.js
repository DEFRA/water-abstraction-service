'use strict';

const { isEmpty } = require('lodash');
const Contact = require('../../../lib/models/contact-v2');

const getInitials = contact => {
  if (contact.initials) return contact.initials;
  if (contact.middleInitials) {
    const firstInitial = contact.firstName.slice(0, 1);
    return `${firstInitial} ${contact.middleInitials}`;
  }
};

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
  contactModel.pickFrom(contact, ['firstName', 'lastName', 'suffix', 'department', 'type']);
  contactModel.title = contact.salutation || null;
  contactModel.initials = getInitials(contact) || null;
  return contactModel;
};

exports.crmToModel = crmToModel;
