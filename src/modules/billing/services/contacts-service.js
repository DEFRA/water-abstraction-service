'use strict';

const Contact = require('../../../lib/models/contact-v2');
const contactsConnector = require('../../../lib/connectors/crm-v2/contacts');

/**
 * Maps a row of CRM v2 contact data to a Contact instance
 * @param {Object} contactData
 * @return {Contact}
 */
const mapCRMContactToModel = contact => {
  const contactModel = new Contact(contact.contactId);
  contactModel.pickFrom(contact, ['initials', 'salutation', 'firstName', 'lastName']);
  return contactModel;
};

/**
 * Gets contacts from CRM v2 API and returns as Contact models
 * @param {Array<String>} contactIds
 * @return {Promise<Array>}
 */
const getContacts = async contactIds => {
  const contacts = await contactsConnector.getContacts(contactIds);
  return contacts.map(mapCRMContactToModel);
};

exports.getContacts = getContacts;
exports.mapCRMContactToModel = mapCRMContactToModel;
