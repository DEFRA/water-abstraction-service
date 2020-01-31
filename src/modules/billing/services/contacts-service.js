'use strict';

const contactsConnector = require('../../../lib/connectors/crm-v2/contacts');
const mappers = require('../mappers');

/**
 * Gets contacts from CRM v2 API and returns as Contact models
 * @param {Array<String>} contactIds
 * @return {Promise<Array>}
 */
const getContacts = async contactIds => {
  const contacts = await contactsConnector.getContacts(contactIds);
  return contacts.map(mappers.contact.crmToModel);
};

exports.getContacts = getContacts;
