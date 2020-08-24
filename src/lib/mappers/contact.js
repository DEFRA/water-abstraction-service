'use strict';

const { isEmpty, omit } = require('lodash');
const Contact = require('../models/contact-v2');
const { has } = require('lodash');

/**
 * Maps a row of CRM v2 contact data to a Contact instance
 * @param {Object} contactData
 * @return {Contact}
 */
const crmToModel = contactData => {
  if (isEmpty(contactData)) {
    return null;
  }

  if (has(contactData, 'contactId')) {
    const contactModel = new Contact(contactData.contactId);
    contactModel.pickFrom(contactData,
      ['firstName', 'initials', 'middleInitials', 'lastName', 'suffix', 'department', 'type', 'dataSource']);
    contactModel.title = contactData.salutation || null;
    return contactModel;
  } else { return new Contact(); }
};

/**
 * Maps only an id or new contact data from the UI
 * @param {Object} contactData from UI
 * @return {Contact}
 */
const uiToModel = contactData => {
  if (!contactData) return null;
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
