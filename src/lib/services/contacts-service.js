'use strict';

const contactsConnector = require('../connectors/crm-v2/contacts');
const mappers = require('../../modules/billing/mappers');
const { InvalidEntityError } = require('../errors');

/**
 * Gets contacts from CRM v2 API and returns as Contact models
 * @param {Array<String>} contactIds
 * @return {Promise<Array>}
 */
const getContacts = async contactIds => {
  const contacts = await contactsConnector.getContacts(contactIds);
  return contacts.map(mappers.contact.crmToModel);
};

const createContact = async contactModel => {
  const contact = await contactsConnector.createContact(mappers.contact.modelToCrm(contactModel));
  return mappers.contact.crmToModel(contact);
};

const deleteContact = async contact => contactsConnector.deleteContact(contact.id);

const getContactModel = contactData => {
  const contactModel = mappers.contact.uiToModel(contactData);
  if (!contactModel.id && !!contactModel) {
    const { error } = contactModel.isValid();
    if (error) throw new InvalidEntityError('Invalid contact', error);
  };
  return contactModel;
};

exports.getContacts = getContacts;
exports.createContact = createContact;
exports.deleteContact = deleteContact;
exports.getContactModel = getContactModel;
