const sha1 = require('sha1');
const { find } = require('lodash');

/**
 * De-duplicates the supplied data
 * Each row of data requires the format { contact, data [, group]}
 * The supplied function is responsible for generating a unique ID given a contact object
 * @param {Array} data
 * @param {Function} func
 * @return {Array} de-duplicated data
 */
const dedupe = (data, func) => {
  const list = {};

  for (let row of data) {
    const { contact, data, group = '_' } = row;

    const contactId = group + '.' + func(contact);

    if (!(contactId in list)) {
      list[contactId] = {
        contact,
        data: []
      };
    };

    list[contactId].data.push(data);
  }

  return Object.values(list);
};

/**
 * Gets/generates a unique contact ID for the supplied contact
 * @param {Object} contact
 * @return {String} contact ID (can be entity ID)
 */
const getContactId = (contact) => {
  if (contact.entity_id) {
    return contact.entity_id;
  }

  function fixCase (str) {
    return typeof (str) === 'string' ? str.toUpperCase() : str;
  }

  return sha1(Object.values(contact).map(fixCase).join(','));
};

/**
 * Given list of licence contacts, this returns the preferred contact based
 * on their role
 * @param {Array} contacts - list of licence contacts
 * @return {Object} - return preferred contact for notification
 */
const getPreferredContact = (contacts, rolePriority) => {
  return rolePriority.reduce((acc, role) => {
    if (acc) {
      return acc;
    }
    return find(contacts, { role });
  }, null);
};

/**
 * Transform contacts transforms a row into the format expected by the
 * de-dupe function
 * @param {Object} row - from CRM document contacts call
 * @param {Array} rolePriority
 * @return {Object}
 */
const transformContact = (row, rolePriority) => {
  const { contacts, ...data } = row;
  const licenceHolder = getPreferredContact(contacts, ['licence_holder']);
  const group = getContactId(licenceHolder);
  return {
    data,
    contact: getPreferredContact(contacts, rolePriority),
    group
  };
};

module.exports = {
  dedupe,
  getContactId,
  getPreferredContact,
  transformContact
};
