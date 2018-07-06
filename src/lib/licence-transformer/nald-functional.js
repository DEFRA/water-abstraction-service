const { find } = require('lodash');
const deepMap = require('deep-map');

/**
 * Formats contact address
 * @param {Object} contactAddress - party/role address
 * @return {Object} reformatted address
 */
const addressFormatter = (contactAddress) => {
  const {
    ADDR_LINE1,
    ADDR_LINE2,
    ADDR_LINE3
  } = contactAddress;
  const {
    ADDR_LINE4,
    TOWN,
    COUNTY,
    POSTCODE,
    COUNTRY
  } = contactAddress;

  return {
    addressLine1: ADDR_LINE1,
    addressLine2: ADDR_LINE2,
    addressLine3: ADDR_LINE3,
    addressLine4: ADDR_LINE4,
    town: TOWN,
    county: COUNTY,
    postcode: POSTCODE,
    country: COUNTRY
  };
};

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

/**
 * @param {Array} versions
 * @return {Array}
 */
const findCurrent = (versions) => {
  return find(versions, version => version.STATUS === 'CURR');
};

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

module.exports = {
  addressFormatter,
  nameFormatter,
  crmNameFormatter,
  findCurrent,
  transformNull
};
