const Nald = require('../../lib/nald');
const Helpers = require('../../lib/helpers');
const Permit = require('../../lib/connectors/permit');
const DB = require('../../lib/connectors/db');
const { orderBy } = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const { filter } = require('lodash');

/**
 * Process single licence, reporting result in DB
 * @param {String} licence_ref - licence number
 * @param {Object} licence_data - from NALD process
 */
async function processSingleLicence (licenceNumber) {
  const params = [licenceNumber];
  try {
    const licenceData = await Nald.licence(licenceNumber);
    licenceData.vmlVersion = 2;
    await exportLicence(licenceNumber, 1, 8, licenceData);
    // Log success
    const query = `update water.pending_import set status=1, date_updated=current_date where licence_ref=$1;`;
    return DB.query(query, params);
  } catch (e) {
    // Log error message
    const query = `update water.pending_import set status=-1, log='${e.message}', date_updated=current_date where licence_ref=$1;`;
    DB.query(query, params);
    // Rethrow error
    throw e;
  }
}

/**
 * Process an array of licence numbers
 * @param {Array} licenceNumbers
 * @return {Promise} resolves with array of true/string error message for each licence
 */
function processMultipleLicences (licenceNumbers) {
  console.log(`Importing ${licenceNumbers.join(', ')}`);
  return Promise.map(licenceNumbers, async (licenceNumber) => {
    try {
      await processSingleLicence(licenceNumber);
      console.log(`Imported ${licenceNumber}`);
      return true;
    } catch (e) {
      return `Error ${licenceNumber}: ` + e.message;
    }
  }, {
    concurrency: 3
  });
}

async function run (data) {
  let licenceNumbers;

  // Query list of licence numbers
  if (data.licence_ref === '-') {
    const query = `select * from water.pending_import where status=0 limit 250;`;
    const { data } = await DB.query(query);
    licenceNumbers = data.map(row => row.licence_ref);
  } else {
    licenceNumbers = data.licence_ref.split(',');
  }

  const result = await processMultipleLicences(licenceNumbers);

  const errors = filter(result, item => item !== true);

  if (errors.length) {
    return;
  }

  // Return message from task
  return errors.length ? { error: errors.join(',') } : { error: null };
}

function sortableStringToDate (str) {
  var d = moment(str, 'YYYYMMDD');
  if (d.isValid()) {
    return d.format('YYYY/MM/DD');
  } else {
    return null;
  }
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

  // console.log('>> exportLicence', JSON.stringify(requestBody, null, 2));

  // delete requestBody.regime_id;
  var {
    data,
    error
  } = await Permit.licences.create(requestBody);
  if (error) {
    if (error.code == '23505') {
      console.log('licence already imported');
      throw error;
    } else {
      throw error;
    }
  }
  //    console.log(`Added ID ${data.licence_id} to Permit repo`);
  var crmPacket = buildCRMPacket(requestBody, licence_ref, data.licence_id);
  var crm = await addLicenceToCRM(crmPacket);
  //    console.log('Added '+crmPacket.system_external_id+'to CRM');
  return {
    error: null
  };
}

function buildCRMPacket (licence_data, licence_ref, licence_id) {
  console.log('buildCRMPacket');
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

    for (attr in metadata) {
      if (metadata[attr] == 'null') {
        metadata[attr] = '';
      }
    }
    crmData.metadata = JSON.stringify(metadata);
  } catch (e) {
    console.log('METADATA ERROR!!! OH NOES!!!');
    console.log(e);
  }
  console.log('buildCRMPacket', crmData);
  return crmData;
}
async function addLicenceToCRM (data) {
  var url = process.env.CRM_URI + '/documentHeader';
  res = await Helpers.makeURIRequestWithBody(
    url,
    'post',
    data, {
      Authorization: process.env.JWT_TOKEN
    }
  );
  return res;
}
module.exports = {
  run
};
