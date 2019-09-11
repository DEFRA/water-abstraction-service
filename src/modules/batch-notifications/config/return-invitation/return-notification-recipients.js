const { uniq, flatMap, identity, groupBy } = require('lodash');
const {
  CONTACT_ROLE_PRIMARY_USER, CONTACT_ROLE_RETURNS_AGENT,
  CONTACT_ROLE_LICENCE_HOLDER, CONTACT_ROLE_RETURNS_TO
} = require('../../../../lib/models/contact');

/**
 * Creates an array of contacts to contact based on the rules for this
 * notification type
 * @param  {ContactList} contactList - all contacts for the document
 * @return {Array}             - a new contact list for the notification
 */
const getPreferredContacts = contactList => {
  // Send emails to digital service users
  const primaryUser = contactList.getByRole(CONTACT_ROLE_PRIMARY_USER);
  if (primaryUser) {
    return [
      primaryUser,
      ...contactList.getAllByRole(CONTACT_ROLE_RETURNS_AGENT)
    ];
  }
  // Send letters to non-null NALD contacts
  return [
    contactList.getByRole(CONTACT_ROLE_LICENCE_HOLDER),
    contactList.getByRole(CONTACT_ROLE_RETURNS_TO)
  ].filter(identity);
};

const mapGroupedRecipient = arr => ({
  contact: arr[0].contact,
  licenceNumbers: uniq(arr.map(row => row.licenceNumber)),
  returnIds: uniq(flatMap(arr, row => row.returnIds))
});

const getRecipientList = returnContacts => {
  const recipients = flatMap(returnContacts, row =>
    getPreferredContacts(row.contacts).map(contact => ({
      contact,
      licenceNumber: row.licenceNumber,
      returnIds: row.returns.map(row => row.return_id)
    }))
  );

  // De-dupe recipients by unique contact / role combination
  const grouped = groupBy(recipients, row =>
    `${row.contact.role}_${row.contact.generateId()}`);

  // Return array list with each recipient including a Contact model,
  // and array of licence numbers and return IDs
  return Object.values(grouped).map(mapGroupedRecipient);
};

exports.getRecipientList = getRecipientList;
