/**
 * Export a licence in anonymised form for unit testing
 */
require('dotenv').config();
const { Pool } = require('pg');
const { mapValues, pick, uniqBy } = require('lodash');
const { walkObjectAsync, walkObject } = require('walk-object')
const Promise = require('bluebird');
const csvStringify = require('csv-stringify/lib/sync');
const fs = require('fs');
const writeFile = Promise.promisify(fs.writeFile);

if (process.env.DATABASE_URL) {
 // get heroku db params from env vars
 var workingVariable = process.env.DATABASE_URL.replace('postgres://', '')
 process.env.PGUSER = workingVariable.split('@')[0].split(':')[0]
 process.env.PGPASSWORD = workingVariable.split('@')[0].split(':')[1]
 process.env.PGHOST = workingVariable.split('@')[1].split(':')[0]
 process.env.PSPORT = workingVariable.split('@')[1].split(':')[1].split('/')[0]
 process.env.PGDATABASE = workingVariable.split('@')[1].split(':')[1].split('/')[1]
}

const pool = new Pool({
 max: 20,
 idleTimeoutMillis: 30000,
 connectionTimeoutMillis: 2000
});

const structure = {
  roleTypes : {
    table : 'NALD_LIC_ROLE_TYPES'
  },
  contTypes : {
    table : 'NALD_CONT_NO_TYPES'
  },
  condTypes : {
    table : 'NALD_LIC_COND_TYPES'
  },
  sources : {
    table : 'NALD_SOURCES'
  },
  root : {
    table : 'NALD_ABS_LICENCES',
    cond : [{ LIC_NO : '03/28/01/0200'}],
    hasMany : [{
        table : 'NALD_ABS_LIC_VERSIONS',
        join : {AABL_ID : 'ID', FGAC_REGION_CODE : 'FGAC_REGION_CODE'},
        hasMany : [{
          table : 'NALD_PARTIES',
          join : {ID : 'ACON_APAR_ID', FGAC_REGION_CODE : 'FGAC_REGION_CODE'},
          hasMany : [{
            table : 'NALD_CONTACTS',
            join : {APAR_ID : 'ID',  FGAC_REGION_CODE : 'FGAC_REGION_CODE'},
            hasMany : [{
              table : 'NALD_ADDRESSES',
              join : {ID : 'AADD_ID',  FGAC_REGION_CODE : 'FGAC_REGION_CODE'},
            }]
          }]
        }]
    }, {
        table : 'NALD_REP_UNITS',
        join : {CODE : 'AREP_CAMS_CODE', FGAC_REGION_CODE : 'FGAC_REGION_CODE'},
    }, {
        table : 'NALD_LIC_ROLES',
        join : {AABL_ID : 'ID', FGAC_REGION_CODE : 'FGAC_REGION_CODE'},
        hasMany : [
        {
          table : 'NALD_PARTIES',
          join : { ID : 'ACON_APAR_ID' }
        }, {
          table : 'NALD_ADDRESSES',
          join : { ID : 'ACON_AADD_ID'}
        }, {
          table : 'NALD_CONT_NOS',
          join : { ACON_APAR_ID : 'ACON_APAR_ID', ACON_AADD_ID : 'ACON_AADD_ID' }
        }]
    }, {
      table : 'NALD_ABS_LIC_PURPOSES',
      join : { AABV_AABL_ID : 'ID'},
      hasMany : [
        {
          table : 'NALD_LIC_CONDITIONS',
          join : { AABP_ID : 'ID',  FGAC_REGION_CODE : 'FGAC_REGION_CODE'}
        },
        {
          table : 'NALD_LIC_AGRMNTS',
          join : { AABP_ID : 'ID', FGAC_REGION_CODE : 'FGAC_REGION_CODE' }
        },
        {
        table : 'NALD_ABS_PURP_POINTS',
        join : { AABP_ID : 'ID'},
        hasMany : [{
          table : 'NALD_MEANS_OF_ABS',
          join : { CODE : 'AMOA_CODE' }
        }, {
          table : 'NALD_POINTS',
          join : { ID : 'AAIP_ID' }
        }]
      }]
    }]
  }
}

async function getData(table, filter = {}) {
  let query = `SELECT * FROM import."${ table }" WHERE 1=1 `;
  const params = [];
  for(key in filter) {
    params.push(filter[key]);
    query += ` AND "${key}"=$${params.length} `;
  }
  console.log(query, params);
  const {rows, error} = await pool.query(query, params);
  if(error) {
    console.error(error);
  }
  return rows;
}


async function getCondData(table, cond) {
  if(cond.length === 0) {
    return getData(table);
  }
  const rowSets = await Promise.map(cond, (cond) => {
    return getData(table, cond);
  });
  // Merge arrays
  const data = [];
  rowSets.forEach((rows) => {
    data.push(...rows);
  });
  return data;
}

async function nodeHandler ({ value, location, isLeaf }) {

  if(value.table) {

    const cond = value.cond || [];

    // Get data for this node
    value.data = await getCondData(value.table, cond);

    // Add conditions to child relationships
    if(value.hasMany) {
      value.hasMany.forEach(rel => {
        rel.cond = value.data.map(row => {
          return mapValues(rel.join, (foreignField) => {
            return row[foreignField];
          });
        });
      });
    }

  }
  return;
}

/**
 * Assumes that first column is primary key field
 * @param {Array} data - array of objects
 * @return {Array} - deduplicated on first column
 */
function deDuplicate(data) {
  if(data.length) {
    const primaryKey = Object.keys(data[0])[0];

    if(primaryKey === 'ID' || primaryKey.match(/_ID$/)) {
        return uniqBy(data, item => item[primaryKey]);
    }


  }
  return data;
}

function getExportData(structure) {
  const data = {};
  walkObject(structure, ({ value, location, isLeaf }) => {
    if(value.data) {
      data[value.table] = value.data;
    }
  });
  return data;
}



async function main() {
    await walkObjectAsync(structure, nodeHandler);

    const exportData = getExportData(structure);

    // Randomise data
    

    // Write CSV data
    mapValues(exportData, (data, tableName) => {
      writeFile('./data/' + tableName + '.csv', csvStringify(data, {header : true}));
    });
}

main();





//
// /**
//  * Gets the licence from licences table
//  * @param {String} licenceNumber - the licence number
//  * @return {Promise} resolves with randomised licence data
//  */
// async function getLicence(licenceNumber) {
//   const sql = 'SELECT * FROM import."NALD_ABS_LICENCES" WHERE "LIC_NO"=$1';
//   const params = [licenceNumber];
//   const {rows} = await pool.query(sql, params);
//   return randomiseRow(rows[0], ['ID', 'LIC_NO', 'FGAC_REGION_CODE', 'CAMS_CODE']);
// }
//
//
// /**
//  * Gets versions
//  * @param {Number} licenceId
//  * @param {Number} regionCode
//  * @return {Promise} resolves with randomised version data
//  */
//  async function getVersions(licenceId, regionCode) {
//    const sql = 'select * from import."NALD_ABS_LIC_VERSIONS" where "AABL_ID"=$1 and "FGAC_REGION_CODE" = $2';
//    const params = [licenceId, regionCode];
//    const {rows} = await pool.query(sql, params);
//    const randomise = (row) => {
//      return randomiseRow(row, ['AABL_ID', 'FGAC_REGION_CODE', 'ACON_APAR_ID', 'ACON_AADD_ID']);
//    }
//    return rows.map(randomise);
//  }
//
//
//  /**
//   * Gets versions
//   * @param {Number} partyId
//   * @param {Number} regionCode
//   * @return {Promise} resolves with randomised version data
//   */
// async function getParties(partyId, regionCode) {
//   const sql = 'select p.* from import."NALD_PARTIES" p where p."ID"=$1 and "FGAC_REGION_CODE" = $2';
//   const params = [partyId, regionCode];
//   const {rows} = await pool.query(sql, params);
//   const randomise = (row) => {
//     return randomiseRow(row, ['ID', 'APAR_TYPE', 'FGAC_REGION_CODE']);
//   }
//   return rows.map(randomise);
// }
//
// /**
//  * Gets party contacts
//  * @param {Number} partyId
//  * @param {Number} regionCode
//  * @return {Promise} resolves with contact data rows
//  */
// async function getPartyContacts(partyId, regionCode) {
//   const sql = 'select * FROM import."NALD_CONTACTS" c WHERE c."APAR_ID"=$1 and c."FGAC_REGION_CODE" = $2';
//   const params = [partyId, regionCode];
//   const {rows} = await pool.query(sql, params);
//   return rows;
// }
//
//
// /**
//  * Gets party addresses
//  * @param {Array} addressIds
//  * @param {Number} regionCode
//  * @return {Promise} resolves with address data rows
//  */
// async function getPartyAddresses(addressIds, regionCode) {
//   const sql = `select * from import."NALD_ADDRESSES" where "ID" IN (${ addressIds.map((x, i) => '$' +(i+1)).join(',') }) and "FGAC_REGION_CODE" = $${ addressIds.length+1}`;
//   const params = [...addressIds, regionCode];
//   const {rows} = await pool.query(sql, params);
//   const randomise = (row) => {
//     return randomiseRow(row, ['ID', 'FGAC_REGION_CODE']);
//   }
//   return rows.map(randomise);
// }
//
//
//
// /**
// * Gets cams
// * @param {Number} code
// * @param {Number} regionCode
// * @return {Promise} resolves with randomised version data
// */
// async function getCams(code, regionCode) {
//   const sql = 'select * from import."NALD_REP_UNITS" where "CODE"=$1 and "FGAC_REGION_CODE" = $2';
//   const params = [code, regionCode];
//   const {rows} = await pool.query(sql, params);
//   const randomise = (row) => {
//     return randomiseRow(row, ['CODE', 'FGAC_REGION_CODE']);
//   }
//   return rows.map(randomise);
// }
//
//
// /**
// * Gets roles for licence
// * @param {Number} licenceId
// * @param {Number} regionCode
// * @return {Promise} resolves with randomised version data
// */
// async function getRoles(licenceId, regionCode) {
//   const sql = 'select * from import."NALD_LIC_ROLES" where "CODE"=$1 and "FGAC_REGION_CODE" = $2';
//   const params = [code, regionCode];
//   const {rows} = await pool.query(sql, params);
//   const randomise = (row) => {
//     return randomiseRow(row, ['CODE', 'FGAC_REGION_CODE']);
//   }
//   return rows.map(randomise);
// }
//
//
//
// async function main() {
//   const data = {};
//   data.NALD_ABS_LICENCES = [];
//   data.NALD_ABS_LIC_VERSIONS = [];
//   data.NALD_PARTIES = [];
//   data.NALD_CONTACTS = [];
//   data.NALD_REP_UNITS = [];
//   data.NALD_ADDRESSES = [];
//
//
//
//   const main = await getLicence(licNo);
//   const versions = await getVersions(main.ID, main.FGAC_REGION_CODE);
//
//   versions.forEach(async (version) => {
//     data.NALD_PARTIES.push(... await getParties(version.ACON_APAR_ID, main.FGAC_REGION_CODE));
//     const contacts = await getPartyContacts(version.ACON_APAR_ID, main.FGAC_REGION_CODE);
//     data.NALD_CONTACTS.push(...contacts);
//
//     const addressIds = contacts.map(contact => contact.AADD_ID);
//     data.NALD_ADDRESSES.push(...await getPartyAddresses(addressIds, main.FGAC_REGION_CODE));
//   });
//
//   data.NALD_ABS_LICENCES.push(main);
//   data.NALD_ABS_LIC_VERSIONS.push(versions);
//   data.NALD_REP_UNITS.push(... await getCams(main.CAMS_CODE, main.FGAC_REGION_CODE));
//
//   console.log(data);
//
//   return;
// }

// main();
