/**
 * Transform data for loading into CRM
 */
/* eslint camelcase: "warn" */

const { mapValues, find } = require('lodash');
const { addressFormatter, findCurrent, crmNameFormatter, transformNull } = require('../../lib/licence-transformer/nald-functional');
const sentenceCase = require('sentence-case');
const moment = require('moment');

/**
 * Contacts formatter
 * Creates a list of contacts from the roles/parties in the NALD data
 * @param {Object} currentVersion - note must be from versions array not current_version
 * @param {Array} roles
 * @return {Array} formatted contacts
 */
const contactsFormatter = (currentVersion, roles) => {
  const contacts = [];

  const licenceHolderParty = find(currentVersion.parties, (party) => {
    return party.ID === currentVersion.ACON_APAR_ID;
  });

  const licenceHolderAddress = find(licenceHolderParty.contacts, (contact) => {
    return contact.AADD_ID === currentVersion.ACON_AADD_ID;
  });

  contacts.push({
    role: 'Licence holder',
    ...crmNameFormatter(licenceHolderParty),
    ...addressFormatter(licenceHolderAddress.party_address)
  });

  roles.forEach((role) => {
    contacts.push({
      role: sentenceCase(role.role_type.DESCR),
      ...crmNameFormatter(licenceHolderParty),
      ...addressFormatter(role.role_address)
    });
  });

  return transformNull(contacts);
};

/**
 * Data from NALD import has null as "null" string
 * prune this to empty value
 */
function pruneNullString (data) {
  return mapValues(data, value => value === 'null' ? '' : value);
}

/**
 * Builds CRM contact data from party/address
 * @param {Object} currentVersion
 * @return {Object} contact metadata
 */
function buildCRMContactMetadata (currentVersion) {
  const party = currentVersion.party;
  const address = currentVersion.address;
  return {
    Name: party.NAME,
    Salutation: party.SALUTATION,
    Initials: party.INITIALS,
    Forename: party.FORENAME,
    AddressLine1: address.ADDR_LINE1,
    AddressLine2: address.ADDR_LINE2,
    AddressLine3: address.ADDR_LINE3,
    AddressLine4: address.ADDR_LINE4,
    Town: address.TOWN,
    County: address.COUNTY,
    Postcode: address.POSTCODE,
    Country: address.COUNTRY
  };
}

/**
 * Build CRM metadata from current licence version data
 * @param {Object} currentVersion
 * @return {Object} CRM metadata object
 */
function buildCRMMetadata (currentVersion) {
  if (!currentVersion) {
    return {
      IsCurrent: false
    };
  }
  const expires = currentVersion.expiry_date;
  const modified = currentVersion.version_effective_date;
  const contact = buildCRMContactMetadata(currentVersion);

  const data = {
    ...contact,
    Expires: expires,
    Modified: modified,
    IsCurrent: true
  };
  return pruneNullString(data);
}

/**
 * Builds CRM packet ready for posting to CRM
 * @param {Object} licenceData - permit repo licence data
 * @param {String} licenceRef - the licence number
 * @param {Number} licenceId - the permit repo licence ID
 * @return {Object} - object containing of row of data for CRM
 */
function buildCRMPacket (licenceData, licenceRef, licenceId) {
  let crmData = {
    regime_entity_id: '0434dc31-a34e-7158-5775-4694af7a60cf',
    system_id: 'permit-repo',
    system_internal_id: licenceId,
    system_external_id: licenceRef
  };
  try {
    const currentVersion = licenceData.data.current_version;
    let metadata = buildCRMMetadata(currentVersion);
    metadata.contacts = contactsFormatter(findCurrent(licenceData.data.versions), licenceData.data.roles);
    crmData.metadata = JSON.stringify(metadata);
  } catch (e) {
    console.error(e);
  }
  return crmData;
}

module.exports = {
  buildCRMPacket,
  buildCRMMetadata
};
