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

/**
 * Maps only an id or new contact data from the UI
 * @param {Object} contactData from UI
 * @return {Contact}
 */
const uiToModel = contactData => {
  if (contactData.contactId) {
    return new Contact(contactData.contactId);
  }
  const contact = new Contact();
  contact.dataSource = Contact.DATA_SOURCE_TYPES.wrls;
  return contact.fromHash(contactData);
};

/**
 * Maps data from contact service model to expected crm shape
 * @param {Contact} contact service model
 * @return {Object}
 */
const modelToCrm = contact => {
  const data = contact.toJSON();
  return {
    ...omit(data, 'title', 'fullName'),
    salutation: data.title
  };
};

exports.crmToModel = crmToModel;
exports.uiToModel = uiToModel;
exports.modelToCrm = modelToCrm;
