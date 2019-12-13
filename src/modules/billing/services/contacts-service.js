'use strict';

const Contact = require('../../../lib/models/contact-v2');
const contactsConnector = require('../../../lib/connectors/crm-v2/contacts');

const getContacts = async contactIds => {
  const contacts = await contactsConnector.getContacts(contactIds);

  return contacts.map(contact => {
    const contactModel = new Contact(contact.contactId);
    contactModel.pickFrom(contact, ['initials', 'salutation', 'firstName', 'lastName']);
    return contactModel;
  });
};

exports.getContacts = getContacts;
