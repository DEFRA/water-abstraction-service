/**
 * Import a single licence
 */
/* eslint camelcase: "warn" */

const Nald = require('../../lib/nald');
const Helpers = require('../../lib/helpers');
const Permit = require('../../lib/connectors/permit');
const { orderBy } = require('lodash');
const moment = require('moment');
const {LicenceNotFoundError} = require('./errors.js');

/**
 * Process single licence, reporting result in DB
 * @param {String} licence_ref - licence number
 * @param {Object} licence_data - from NALD process
 */
async function importLicence (licenceNumber) {
  const licenceData = await Nald.licence(licenceNumber);
  if (!licenceData) {
    throw new LicenceNotFoundError(`Licence ${licenceNumber} not found in import table`);
  }
  licenceData.vmlVersion = 2;
  await exportLicence(licenceNumber, 1, 8, licenceData);
}

/**
 * Formats a UK date from NALD data to a SQL style date
 * e.g. 31/01/2018 becomes 2018-01-31
 * @param {String} str - NALD date string, can be 'null'
 * @return {String} date in SQL format
 */
function naldDateToSql (str) {
  const d = moment(str, 'DD/MM/YYYY');
  if (d.isValid()) {
    return d.format('YYYY-MM-DD');
  } else {
    return null;
  }
}

/**
 * Gets the latest version of the specified licence data
 * by sorting on the effective start date of the versions array
 * - Note: this may not be the current version
 * @param {Array} versions - licence data versions array from NALD import process
 * @return {Object} latest version
 */
function getLatestVersion (versions) {
  const sortedVersions = orderBy(versions, (version) => {
    const issueNo = 1000 * parseInt(version.ISSUE_NO, 10);
    const incrNo = parseInt(version.INCR_NO, 10);
    return issueNo + incrNo;
  });
  return sortedVersions[sortedVersions.length - 1];
}

async function exportLicence (licence_ref, regime_id, licence_type_id, data) {
  const latestVersion = getLatestVersion(data.data.versions);

  var requestBody = {
    licence_ref: licence_ref,
    licence_start_dt: naldDateToSql(latestVersion.EFF_ST_DATE),
    licence_end_dt: naldDateToSql(latestVersion.EFF_END_DATE),
    licence_status_id: '1',
    licence_type_id: licence_type_id,
    licence_regime_id: regime_id,
    licence_data_value: JSON.stringify(data)
  };

  // remove null attributes so as not to anger JOI
  if (requestBody.licence_end_dt == null) {
    delete requestBody.licence_end_dt;
  }

  if (requestBody.licence_start_dt == null) {
    delete requestBody.licence_start_dt;
  }

  var {
    data: licenceData,
    error
  } = await Permit.licences.create(requestBody);
  if (error) {
    if (error.code === '23505') {
      console.error('licence already imported');
      throw error;
    } else {
      throw error;
    }
  }
  var crmPacket = buildCRMPacket(requestBody, licence_ref, licenceData.licence_id);
  await addLicenceToCRM(crmPacket);
  return {
    error: null
  };
}

function buildCRMPacket (licence_data, licence_ref, licence_id) {
  var crmData = {};
  crmData.regime_entity_id = '0434dc31-a34e-7158-5775-4694af7a60cf';
  crmData.system_id = 'permit-repo';
  crmData.system_internal_id = licence_id;
  crmData.system_external_id = licence_ref;
  try {
    var baseLicence = JSON.parse(licence_data.licence_data_value).data.current_version;
    let metadata;
    // Licence has a current version
    if (baseLicence) {
      const party = baseLicence.party;
      const address = baseLicence.address;
      const expires = baseLicence.expiry_date;
      const modified = baseLicence.version_effective_date;
      metadata = {
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
        Country: address.COUNTRY,
        Expires: expires,
        Modified: modified,
        IsCurrent: true
      };
    } else {
      metadata = {
        IsCurrent: false
      };
    }

    for (let attr in metadata) {
      if (metadata[attr] === 'null') {
        metadata[attr] = '';
      }
    }
    crmData.metadata = JSON.stringify(metadata);
  } catch (e) {
    console.log('METADATA ERROR!!! OH NOES!!!');
    console.log(e);
  }
  return crmData;
}
async function addLicenceToCRM (data) {
  var url = process.env.CRM_URI + '/documentHeader';
  let res = await Helpers.makeURIRequestWithBody(
    url,
    'post',
    data, {
      Authorization: process.env.JWT_TOKEN
    }
  );
  return res;
}

module.exports = {
  importLicence
};
