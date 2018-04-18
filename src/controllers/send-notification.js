const { find } = require('lodash');
const sha1 = require('sha1');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

/**
 * Get contacts list from CRM
 * @param {String} filter
 * @return {Promise} resolves with contact data from CRM
 */
function getCrmContacts (filter = '{}') {
  return rp({
    uri: `${process.env.CRM_URI}/contacts`,
    method: 'GET',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    json: true,
    qs: { filter }
  });
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
    const primaryUser = find(licence.contacts, { role: 'primary_user' });

    // Create contact ID for licence holder
    const licenceHolderId = getContactId(licenceHolder);

    // Who do we want to contact?  primary user if available, but default
    // to contacting licence holder by post.  In future this logic may
    // incorporate e.g. sending to specific contacts for different purposes
    const contact = primaryUser || licenceHolder;

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
    const { document_id, system_external_id, document_name } = licence;
    list[contactKey].licences.push({ document_id, system_external_id, document_name, licence_holder: licenceHolder });
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
    const { error, data } = await getCrmContacts(filter);

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
