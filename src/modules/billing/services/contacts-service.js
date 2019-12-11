'use strict';

const Contact = require('../../../lib/models/contact-v2');
const contactsConnector = require('../../../lib/connectors/crm-v2/contacts');

const getContacts = async contactIds => {
  const contacts = await contactsConnector.getContacts(contactIds);

  return contacts.map(contact => {
    const contactModel = new Contact();
    contactModel.id = contact.contactId;
    contactModel.initials = contact.initials;
    contactModel.salutation = contact.salutation;
    contactModel.firstName = contact.firstName;
    contactModel.lastName = contact.lastName;

    return contactModel;
  });
};

exports.getContacts = getContacts;
