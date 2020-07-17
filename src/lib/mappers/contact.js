'use strict';

const { isEmpty } = require('lodash');
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
  contactModel.pickFrom(contact, ['initials', 'salutation', 'firstName', 'lastName']);
  return contactModel;
};

exports.crmToModel = crmToModel;
