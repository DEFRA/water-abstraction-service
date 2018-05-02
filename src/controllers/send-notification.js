const { find } = require('lodash');
const sha1 = require('sha1');
const { getDocumentContacts } = require('../lib/connectors/crm/documents');

// This is the order of
const notificationPriority = ['document_notifications', 'notifications', 'area_import', 'licence_holder'];

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
    const contact = notificationPriority.reduce((acc, role) => {
      if (acc) {
        return acc;
      }
      return find(licence.contacts, { role });
    }, null);

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
    const { document_id: documentId, system_external_id: systemExternalId, document_name: documentName } = licence;
    list[contactKey].licences.push({
      document_id: documentId,
      system_external_id: systemExternalId,
      document_name: documentName,
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
 * Send a notification
 * The process is:
 * - select template (and personalisation variables)
 * - select audience (licence numbers)
 * - generate contact list
 * - send
 *
 * This function assumes that the audience is already selected.  It takes
 * a list of licence numbers, and generates a de-duplicated contact list.
 * Later, it can also do the sending, logging etc.
 */
async function send (request, reply) {
  try {
    // Get licence/contact list
    const { filter } = request.payload;
    const { error, data } = await getDocumentContacts(JSON.parse(filter));

    if (error) {
      throw error;
    }

    const contacts = createSendList(data);

    reply(contacts);
  } catch (error) {
    console.log(error);
    reply(error);
  }
}

module.exports = {
  send
};
