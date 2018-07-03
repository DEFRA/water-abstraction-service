/**
 * Transform data for loading into CRM
 */
/* eslint camelcase: "warn" */

const { mapValues } = require('lodash');
const { MetaDataError } = require('./lib/errors.js');

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
    crmData.metadata = JSON.stringify(buildCRMMetadata(currentVersion));
  } catch (e) {
    console.error(new MetaDataError(e));
  }
  return crmData;
}

module.exports = {
  buildCRMPacket
};
