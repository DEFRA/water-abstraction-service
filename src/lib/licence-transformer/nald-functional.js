const deepMap = require('deep-map');

/**
 * Formats contact address
 * @param {Object} contactAddress - party/role address
 * @return {Object} reformatted address
 */
const addressFormatter = (contactAddress) => ({
  addressLine1: contactAddress.ADDR_LINE1,
  addressLine2: contactAddress.ADDR_LINE2,
  addressLine3: contactAddress.ADDR_LINE3,
  addressLine4: contactAddress.ADDR_LINE4,
  town: contactAddress.TOWN,
  county: contactAddress.COUNTY,
  postcode: contactAddress.POSTCODE,
  country: contactAddress.COUNTRY
});

/**
 * Formats a party name - whether person or organisation
 * @param {Object} party - NALD party / role party
 * @return {Object} contact name
 */
const nameFormatter = (party) => {
  if (party.APAR_TYPE === 'PER') {
    const parts = [party.SALUTATION, party.INITIALS, party.NAME];
    return {
      contactType: 'Person',
      name: parts.filter(s => s).join(' ')
    };
  }
  if (party.APAR_TYPE === 'ORG') {
    return {
      contactType: 'Organisation',
      name: party.NAME
    };
  }
};

/**
 * Format name parts from NALD party for CRM contacts
 * @param {Object} party
 * @return {Object} party
 */
const crmNameFormatter = (party) => {
  const { SALUTATION: salutation, INITIALS: initials, NAME: name, APAR_TYPE, FORENAME: forename } = party;
  return {
    type: APAR_TYPE === 'PER' ? 'Person' : 'Organisation',
    salutation,
    forename,
    initials,
    name
  };
};

const isCurrentVersion = version => version.STATUS === 'CURR';

/**
 * From an array of version, finds a versiont that has a status of CURR
 * @param {Array} versions
 * @return {Object | undefined} The current version or undeined if not current version
 */
const findCurrent = (versions = []) => versions.find(isCurrentVersion);

/**
 * Transform string 'null' values to real null
 * @param {Object} data
 * @return {Object}
 */
const transformNull = (data) => {
  return deepMap(data, (val) => {
    // Convert string null to real null
    if (typeof (val) === 'string' && val === 'null') {
      return null;
    }
    return val;
  });
};

exports.addressFormatter = addressFormatter;
exports.nameFormatter = nameFormatter;
exports.crmNameFormatter = crmNameFormatter;
exports.findCurrent = findCurrent;
exports.transformNull = transformNull;
