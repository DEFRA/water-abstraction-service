'use strict';

const contactsConnector = require('../connectors/crm-v2/contacts');
const mappers = require('../../modules/billing/mappers');

/**
 * Gets contacts from CRM v2 API and returns as Contact models
 * @param {Array<String>} contactIds
 * @return {Promise<Array>}
 */
const getContacts = async contactIds => {
  const contacts = await contactsConnector.getContacts(contactIds);
  return contacts.map(mappers.contact.crmToModel);
};

const createContact = async contactData => {
  const contact = await contactsConnector.createContact(mappers.contact.serviceToCrm(contactData));
  return mappers.contact.crmToModel(contact);
};

exports.getContacts = getContacts;
exports.createContact = createContact;
