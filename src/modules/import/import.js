/**
 * Import a single licence
 */
/* eslint camelcase: "warn" */
const moment = require('moment');
const {mapValues, orderBy} = require('lodash');

const { getLicenceJson } = require('./nald.js');
const Permit = require('../../lib/connectors/permit');
const Documents = require('../../lib/connectors/crm/documents');
const { LicenceNotFoundError, MetaDataError } = require('./errors.js');

/**
 * Process single licence, reporting result in DB
 * @param {String} licence_ref - licence number
 * @param {Object} licence_data - from NALD process
 */
async function importLicence (licenceNumber) {
  const licenceData = await getLicenceJson(licenceNumber);
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

/**
 * Persists licence to permit repo and CRM
 * @param {Object} requestBody - the request body to send to permit repo
 * @return {Promise}
 */
const persistLicence = async (requestBody) => {
  const { data, error } = await Permit.licences.create(requestBody);
  if (error) {
    console.error(error);
    throw error;
  }
  const crmPacket = buildCRMPacket(requestBody, requestBody.licence_ref, data.licence_id);
  const { error: crmError } = await Documents.create(crmPacket);
  if (crmError) {
    console.error(crmError);
    throw crmError;
  };
};

async function exportLicence (licenceRef, regimeId, licenceTypeId, data) {
  const latestVersion = getLatestVersion(data.data.versions);

  var requestBody = {
    licence_ref: licenceRef,
    licence_start_dt: naldDateToSql(latestVersion.EFF_ST_DATE),
    licence_end_dt: naldDateToSql(latestVersion.EFF_END_DATE),
    licence_status_id: '1',
    licence_type_id: licenceTypeId,
    licence_regime_id: regimeId,
    licence_data_value: JSON.stringify(data)
  };

  // remove null attributes so as not to anger JOI
  if (requestBody.licence_end_dt == null) {
    delete requestBody.licence_end_dt;
  }

  if (requestBody.licence_start_dt == null) {
    delete requestBody.licence_start_dt;
  }

  return persistLicence(requestBody);
}

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

function buildCRMPacket (licence_data, licence_ref, licence_id) {
  let crmData = {
    regime_entity_id: '0434dc31-a34e-7158-5775-4694af7a60cf',
    system_id: 'permit-repo',
    system_internal_id: licence_id,
    system_external_id: licence_ref
  };
  try {
    const currentVersion = JSON.parse(licence_data.licence_data_value).data.current_version;
    crmData.metadata = JSON.stringify(buildCRMMetadata(currentVersion));
  } catch (e) {
    console.error(new MetaDataError(e));
  }
  return crmData;
}

module.exports = {
  importLicence
};
