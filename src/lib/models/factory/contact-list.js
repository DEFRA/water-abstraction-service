const sentenceCase = require('sentence-case')
const { find, get } = require('lodash')

// Import models
const Contact = require('../contact')
const ContactList = require('../contact-list')
const nald = require('@envage/water-abstraction-helpers').nald

const { createContact } = require('./contact')

/**
 * Given the current version object, gets the licence holder party
 * @param  {Object} currentVersion
 * @return {Object} the party for the current licence holder
 */
const getLicenceHolderParty = currentVersion => {
  return find(currentVersion.parties, (party) => {
    return party.ID === currentVersion.ACON_APAR_ID
  })
}

/**
 * Given the current version and party objects, gets the licence holder address
 * @param {Object} currentVersion
 * @param {Object} licenceHolderParty
 * @return {Object} the address for the current licence holder
 */
const getLicenceHolderAddress = (currentVersion, licenceHolderParty) => {
  return find(licenceHolderParty.contacts, (contact) => {
    return contact.AADD_ID === currentVersion.ACON_AADD_ID
  })
}

const mapRole = role => sentenceCase(role.role_type.DESCR)

/**
 * Checks whether the NALD role is one we wish to include in our model
 * @param  {Object} role
 * @return {Boolean} true if the contact with this role should be included
 */
const rolePredicate = role => {
  const contactCodes = ['FM', 'LA', 'LC', 'MG', 'RT']
  return contactCodes.includes(role.role_type.CODE)
}

/**
 * Creates a contacts object given NALD permit data
 * @param  {Object} data - from licence_data_value field
 * @return {ContactList}
 */
const createContacts = (data) => {
  // Initialise contact list
  const contacts = new ContactList()

  // Get current version
  const currentVersion = nald.findCurrent(data.data.versions)
  if (!currentVersion) {
    return contacts
  }

  // Add licence holder contact
  const licenceHolderParty = getLicenceHolderParty(currentVersion)
  const licenceHolderAddress = getLicenceHolderAddress(currentVersion, licenceHolderParty)

  const licenceHolder = createContact(
    Contact.CONTACT_ROLE_LICENCE_HOLDER, licenceHolderParty, licenceHolderAddress.party_address
  )
  contacts.add(licenceHolder)

  // Add other contacts for allowed roles
  const roles = get(data, 'data.roles')
  roles.filter(rolePredicate).forEach((role) => {
    const contact = createContact(mapRole(role), role.role_party, role.role_address)
    contacts.add(contact)
  })

  return contacts
}

exports.createContacts = createContacts
