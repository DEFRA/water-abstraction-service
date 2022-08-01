const Contact = require('../contact')

/**
 * Maps a NALD value, converting 'null' string to null
 * @param  {String} value - the NALD value
 * @return {String|Null}
 */
const mapValue = value => value === 'null' ? null : value

/**
 * Maps the type of the NALD party to our internal type
 * @param  {Object} party the party object
 * @return {String} contact type
 */
const mapType = (party) => {
  const isOrg = party.APAR_TYPE === 'ORG'
  return isOrg ? Contact.CONTACT_TYPE_ORGANISATION : Contact.CONTACT_TYPE_PERSON
}

/**
 * Maps NALD party to the fields in our contact model
 * @param  {Object} party - NALD party data
 * @return {Object} mapped contact type and name
 */
const mapParty = party => ({
  type: mapType(party),
  salutation: mapValue(party.SALUTATION),
  initials: mapValue(party.INITIALS),
  firstName: mapValue(party.FORENAME),
  name: mapValue(party.NAME)
})

/**
 * Maps NALD address to the fields in out contact model
 * @param  {Object} address - NALD address
 * @return {Object} mapped contact address
 */
const mapAddress = address => ({
  addressLine1: mapValue(address.ADDR_LINE1),
  addressLine2: mapValue(address.ADDR_LINE2),
  addressLine3: mapValue(address.ADDR_LINE3),
  addressLine4: mapValue(address.ADDR_LINE4),
  town: mapValue(address.TOWN),
  county: mapValue(address.COUNTY),
  postcode: mapValue(address.POSTCODE),
  country: mapValue(address.COUNTRY)
})

/**
 * Creates a contact model given a role string, a NALD party object, and
 * a NALD address object
 * @param  {String} role    - the role of the contact
 * @param  {Object} party   - NALD party object
 * @param  {Object} address - NALD address object
 * @return {Contact}
 */
const createContact = (role, party, address) => {
  return new Contact({
    role,
    ...mapParty(party),
    ...mapAddress(address)
  })
}

exports.createContact = createContact
