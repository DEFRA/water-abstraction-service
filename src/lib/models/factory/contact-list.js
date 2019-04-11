const sentenceCase = require('sentence-case');
const { find, get } = require('lodash');

// Import models
const Contact = require('../contact');
const ContactList = require('../contact-list');

/**
 * Given the current version object, gets the licence holder party
 * @param  {Object} currentVersion
 * @return {Object} the party for the current licence holder
 */
const getLicenceHolderParty = currentVersion => {
  return find(currentVersion.parties, (party) => {
    return party.ID === currentVersion.ACON_APAR_ID;
  });
};

/**
 * Given the current version and party objects, gets the licence holder address
 * @param {Object} currentVersion
 * @param {Object} licenceHolderParty
 * @return {Object} the address for the current licence holder
 */
const getLicenceHolderAddress = (currentVersion, licenceHolderParty) => {
  return find(licenceHolderParty.contacts, (contact) => {
    return contact.AADD_ID === currentVersion.ACON_AADD_ID;
  });
};

/**
 * Maps the type of the NALD party to our internal type
 * @param  {Object} party the party object
 * @return {String} contact type
 */
const mapType = (party) => {
  const isOrg = party.APAR_TYPE === 'ORG';
  return isOrg ? Contact.CONTACT_TYPE_ORGANISATION : Contact.CONTACT_TYPE_PERSON;
};

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
});

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
});

/**
 * Maps a NALD value, converting 'null' string to null
 * @param  {String} value - the NALD value
 * @return {String|Null}
 */
const mapValue = value => value === 'null' ? null : value;

/**
 * Creates a contacts object given NALD permit data
 * @param  {Object} data - from licence_data_value field
 * @return {ContactList}
 */
const createContacts = (data) => {
  const currentVersion = find(data.data.versions, version => version.STATUS === 'CURR');
  const roles = get(data, 'data.roles');

  // Initialise contact list
  const contacts = new ContactList();

  if (!currentVersion) {
    return contacts;
  }

  // Add licence holder contact
  const licenceHolderParty = getLicenceHolderParty(currentVersion);
  const licenceHolderAddress = getLicenceHolderAddress(currentVersion, licenceHolderParty);

  contacts.add(new Contact({
    role: Contact.CONTACT_ROLE_LICENCE_HOLDER,
    ...mapParty(licenceHolderParty),
    ...mapAddress(licenceHolderAddress.party_address)
  }));

  // Add other contacts for allowed roles
  const contactCodes = ['FM', 'LA', 'LC', 'MG', 'RT'];
  roles.filter(role => contactCodes.includes(role.role_type.CODE)).forEach((role) => {
    contacts.add({
      role: sentenceCase(role.role_type.DESCR),
      ...mapParty(role.role_party),
      ...mapAddress(role.role_address)
    });
  });

  return contacts;
};

module.exports.createContacts = createContacts;
