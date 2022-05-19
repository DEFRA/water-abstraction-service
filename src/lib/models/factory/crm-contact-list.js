const { isNull } = require('lodash')

// Import models
const Contact = require('../contact')
const ContactList = require('../contact-list')

/**
 * Maps a role returned from the CRM to the water service Contact model role
 * @param  {String} role - role from CRM document contacts API call
 * @return {String} Contact role
 */
const mapRole = role => {
  const roles = {
    licence_holder: Contact.CONTACT_ROLE_LICENCE_HOLDER,
    returns_to: Contact.CONTACT_ROLE_RETURNS_TO,
    primary_user: Contact.CONTACT_ROLE_PRIMARY_USER,
    user: Contact.CONTACT_ROLE_AGENT,
    user_returns: Contact.CONTACT_ROLE_RETURNS_AGENT
  }
  return roles[role]
}

const mapType = contact => {
  // Service user
  if (contact.entity_id) {
    return contact.role === 'company'
      ? Contact.CONTACT_TYPE_ORGANISATION
      : Contact.CONTACT_TYPE_PERSON
  }
  // NALD company
  if (isNull(contact.initials) && isNull(contact.forename) && isNull(contact.salutation)) {
    return Contact.CONTACT_TYPE_ORGANISATION
  }
  // NALD person
  return Contact.CONTACT_TYPE_PERSON
}

const mapEntity = contact => ({
  initials: contact.initials,
  salutation: contact.salutation,
  firstName: contact.forename,
  name: contact.name
})

const mapAddress = contact => ({
  addressLine1: contact.address_1,
  addressLine2: contact.address_2,
  addressLine3: contact.address_3,
  addressLine4: contact.address_4,
  town: contact.town,
  county: contact.county,
  postcode: contact.postcode,
  country: contact.country
})

/**
 * Creates a contacts object given CRM contact data for a document
 * @param  {Object} data - from CRM contacts
 * @return {ContactList}
 */
const createContacts = (data) => {
  // Initialise contact list
  const contacts = new ContactList()

  data.forEach(contact => {
    contacts.add(new Contact({
      role: mapRole(contact.role),
      type: mapType(contact),
      email: contact.email,
      ...mapEntity(contact),
      ...mapAddress(contact)
    }))
  })

  return contacts
}

exports._mapType = mapType
exports.createContacts = createContacts
