'use strict';

const Contact = require('../../../lib/models/contact-v2');

/**
 * Maps a row of CRM v2 contact data to a Contact instance
 * @param {Object} contactData
 * @return {Contact}
 */
const crmToModel = contact => {
  const contactModel = new Contact(contact.contactId);
  contactModel.pickFrom(contact, ['initials', 'salutation', 'firstName', 'lastName']);
  return contactModel;
};

exports.crmToModel = crmToModel;
