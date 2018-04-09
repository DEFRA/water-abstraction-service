const Nald = require('../../lib/nald');
const Helpers = require('../../lib/helpers');
const Permit = require('../../lib/connectors/permit');
const DB = require('../../lib/connectors/db');
const { orderBy } = require('lodash');
const moment = require('moment');

async function run (data) {
  console.log('run!');
  if (data.licence_ref == '-') {
    console.log('request for next pending licence');
    var query = `
    select * from water.pending_import where status=0 limit 250;`;
    var licenceQuery = await DB.query(query);
    if (licenceQuery.data) {
      for (licenceNo in licenceQuery.data) {
        try {
          licence_ref = licenceQuery.data[licenceNo].licence_ref;
          var licence = await Nald.licence(licence_ref);
          var exp = await processLicence(licence_ref, licence);
        } catch (e) {
          var query = `update water.pending_import set status=-1, log='${e.message}', date_updated=current_date where licence_ref=$1;`;
          var licenceStatusUpdate = await DB.query(query, [licence_ref]);

          return {
            error: e.message
          };
        }
      }
      return {
        error: null
      };
    } else {
      console.log('no licences waiting');
      return {
        error: null
      };
    }
    return {
      error: null
    };
  } else {
    console.log('request for ', data.licence_ref);
    var licence = await Nald.licence(data.licence_ref);

    // console.log(JSON.stringify(licence, null, 2));
    if (licence) {
      try {
        var exp = await processLicence(data.licence_ref, licence);
      } catch (e) {
        var query = `update water.pending_import set status=-1, log='${e.message}', date_updated=current_date where licence_ref=$1;`;
        var licenceStatusUpdate = await DB.query(query, [data.licence_ref]);
        return {
          error: e.message
        };
      }
    } else {
      var query = `update water.pending_import set status=-1, log='Licence not found', date_updated=current_date where licence_ref=$1;`;
      var licenceStatusUpdate = await DB.query(query, [data.licence_ref]);
      return {
        error: `Licence data for ${data.licence_ref} is undefined`
      };
    }
  }
}

async function processLicence (licence_ref, licence_data) {
  try {
    licence_data.vmlVersion = 2;
    var exp = await exportLicence(licence_ref, 1, 8, licence_data);
    var query = `update water.pending_import set status=1, date_updated=current_date where licence_ref=$1;`;
    var licenceStatusUpdate = await DB.query(query, [licence_ref]);
  } catch (e) {
    throw e.message;
  }
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
    return moment(version.EFF_ST_DATE, 'DD/MM/YYYY').unix();
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

  console.log('>> exportLicence', JSON.stringify(requestBody, null, 2));

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
