/**
 * Gets a filtered list of licences together with all
 * attached contacts, from the CRM.
 * Contains logic to select the correct contact based on a pre-defined
 * priority order, and then de-duplicates to send the minimum number of
 * messages.
 * Returns an array of contacts, each with a list of licences
 *
 * @module src/modules/notifications/contact-list
 */

/* eslint camelcase: "warn" */

const { find } = require('lodash');
const sha1 = require('sha1');
const { getDocumentContacts } = require('../../../lib/connectors/crm/documents');

/**
 * Given list of licence contacts, this returns the preferred contact based
 * on their role
 * @param {Array} contacts - list of licence contacts
 * @return {Object} - return preferred contact for notification
 */
function getPreferredContact (contacts) {
  const notificationPriority = ['document_notifications', 'notifications', 'area_import', 'licence_holder'];
  return notificationPriority.reduce((acc, role) => {
    if (acc) {
      return acc;
    }
    return find(contacts, { role });
  }, null);
}

/**
 * De-duplicate licence/contact list
 * @param {Array} contacts
 * @return {Array} list of contacts to send to, and the licences it relates to
 */
function createSendList (licences) {
  const list = {};

  licences.forEach(licence => {
    // Get relevant contacts
    const licenceHolder = find(licence.contacts, { role: 'licence_holder' });

    // Get preferred notification contact
    // In future this may need to support sending specific messages to differnet
    // users.  For now it follows the priority order listed above - these are
    // either entity_roles or document_entity roles
    const contact = getPreferredContact(licence.contacts);

    // Create contact ID for licence holder
    const licenceHolderId = getContactId(licenceHolder);

    const contactId = getContactId(contact);

    // Generate a key - composite of contact and licence holder
    // (means notifications will always be about a specific licence holder)
    const contactKey = licenceHolderId + '_' + contactId;

    if (!(contactKey in list)) {
      list[contactKey] = {
        method: contact.email ? 'email' : 'post',
        contact,
        licences: []
      };
    }

    // Add licence
    const { document_id, system_external_id, document_name, system_internal_id, company_entity_id } = licence;

    list[contactKey].licences.push({
      document_id,
      system_external_id,
      system_internal_id,
      company_entity_id,
      document_name,
      licence_holder: licenceHolder
    });
  });

  return Object.values(list);
}

/**
 * Gets/generates a unique contact ID for the supplied contact
 * @param {Object} contact
 * @return {String} contact ID (can be entity ID)
 */
function getContactId (contact) {
  if (contact.entity_id) {
    return contact.entity_id;
  }
  return sha1(Object.values(contact).join(','));
}

/**
 * Get de a list of de-duplicated contacts/licences
 * @param {Object} filter - the filter params to select licences from CRM
 * @return {Array} - list of contacts with licence details
 */
async function getContacts (filter) {
  const { error, data } = await getDocumentContacts(filter);

  if (error) {
    throw error;
  }

  return createSendList(data);
}

module.exports = getContacts;
