/**
 * Export a licence in anonymised form for unit testing
 */
require('dotenv').config();
const { Pool } = require('pg');
const { mapValues, pick } = require('lodash');

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



/**
 * Get a random character
 * @param {String} char - the current value
 * @return {String} a randomised value
 */
function getRandomChar(char) {
  let possible;
  if(char.match(/[ABCDEFGHIJKLMNOPQRSTUVWXYZ]/)) {
    possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  else if(char.match(/[abcdefghijklmnopqrstuvwxyz]/)) {
    possible = 'abcdefghijklmnopqrstuvwxyz';
  }
  else if(char.match(/[0123456789]/)) {
    possible = '0123456789';
  }
  else {
    return char;
  }
  return possible.charAt(Math.floor(Math.random() * possible.length));
}


/**
 * Randomise a single field value
 * @param {String} val - a value, e.g. a licence number, expiry date, text string
 * @return {String} a randomised version that looks similar
 */
function randomiseValue(val) {
  if(val.toLowerCase() === 'null') {
    return val;
  }
  // Dates
  if(val.match(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/)) {
    return '01/01/2018';
  }
  // Other strings
  let newStr = '';
  for(let i =0; i<val.length; i++) {
    newStr += getRandomChar(val.substr(i, 1));
  }
  return newStr;
}


/**
 * Randomise a row data object
 * @param {Object} row
 * @param {Array} omitFields - a list of fields to omit from randomisation
 * @return {Object} with data randomised
 */
function randomiseRow(row, omitFields = []) {
  const picked = pick(row, omitFields);
  return Object.assign({}, mapValues(row, randomiseValue), picked);
}


/**
 * Gets the licence from licences table
 * @param {String} licenceNumber - the licence number
 * @return {Promise} resolves with randomised licence data
 */
async function getLicence(licenceNumber) {
  const sql = 'SELECT * FROM import."NALD_ABS_LICENCES" WHERE "LIC_NO"=$1';
  const params = [licenceNumber];
  const {rows} = await pool.query(sql, params);
  return randomiseRow(rows[0], ['ID', 'LIC_NO', 'FGAC_REGION_CODE', 'CAMS_CODE']);
}


/**
 * Gets versions
 * @param {Number} licenceId
 * @param {Number} regionCode
 * @return {Promise} resolves with randomised version data
 */
 async function getVersions(licenceId, regionCode) {
   const sql = 'select * from import."NALD_ABS_LIC_VERSIONS" where "AABL_ID"=$1 and "FGAC_REGION_CODE" = $2';
   const params = [licenceId, regionCode];
   const {rows} = await pool.query(sql, params);
   const randomise = (row) => {
     return randomiseRow(row, ['AABL_ID', 'FGAC_REGION_CODE', 'ACON_APAR_ID', 'ACON_AADD_ID']);
   }
   return rows.map(randomise);
 }


 /**
  * Gets versions
  * @param {Number} partyId
  * @param {Number} regionCode
  * @return {Promise} resolves with randomised version data
  */
async function getParties(partyId, regionCode) {
  const sql = 'select p.* from import."NALD_PARTIES" p where p."ID"=$1 and "FGAC_REGION_CODE" = $2';
  const params = [partyId, regionCode];
  const {rows} = await pool.query(sql, params);
  const randomise = (row) => {
    return randomiseRow(row, ['ID', 'APAR_TYPE', 'FGAC_REGION_CODE']);
  }
  return rows.map(randomise);
}

/**
 * Gets party contacts
 * @param {Number} partyId
 * @param {Number} regionCode
 * @return {Promise} resolves with contact data rows
 */
async function getPartyContacts(partyId, regionCode) {
  const sql = 'select * FROM import."NALD_CONTACTS" c WHERE c."APAR_ID"=$1 and c."FGAC_REGION_CODE" = $2';
  const params = [partyId, regionCode];
  const {rows} = await pool.query(sql, params);
  return rows;
}


/**
 * Gets party addresses
 * @param {Array} addressIds
 * @param {Number} regionCode
 * @return {Promise} resolves with address data rows
 */
async function getPartyAddresses(addressIds, regionCode) {
  const sql = `select * from import."NALD_ADDRESSES" where "ID" IN (${ addressIds.map((x, i) => '$' +(i+1)).join(',') }) and "FGAC_REGION_CODE" = $${ addressIds.length+1}`;
  const params = [...addressIds, regionCode];
  const {rows} = await pool.query(sql, params);
  const randomise = (row) => {
    return randomiseRow(row, ['ID', 'FGAC_REGION_CODE']);
  }
  return rows.map(randomise);
}



/**
* Gets cams
* @param {Number} code
* @param {Number} regionCode
* @return {Promise} resolves with randomised version data
*/
async function getCams(code, regionCode) {
  const sql = 'select * from import."NALD_REP_UNITS" where "CODE"=$1 and "FGAC_REGION_CODE" = $2';
  const params = [code, regionCode];
  const {rows} = await pool.query(sql, params);
  const randomise = (row) => {
    return randomiseRow(row, ['CODE', 'FGAC_REGION_CODE']);
  }
  return rows.map(randomise);
}


/**
* Gets roles for licence
* @param {Number} licenceId
* @param {Number} regionCode
* @return {Promise} resolves with randomised version data
*/
async function getRoles(licenceId, regionCode) {
  const sql = 'select * from import."NALD_LIC_ROLES" where "CODE"=$1 and "FGAC_REGION_CODE" = $2';
  const params = [code, regionCode];
  const {rows} = await pool.query(sql, params);
  const randomise = (row) => {
    return randomiseRow(row, ['CODE', 'FGAC_REGION_CODE']);
  }
  return rows.map(randomise);
}



async function main() {
  const data = {};
  data.NALD_ABS_LICENCES = [];
  data.NALD_ABS_LIC_VERSIONS = [];
  data.NALD_PARTIES = [];
  data.NALD_CONTACTS = [];
  data.NALD_REP_UNITS = [];
  data.NALD_ADDRESSES = [];



  const main = await getLicence(licNo);
  const versions = await getVersions(main.ID, main.FGAC_REGION_CODE);

  versions.forEach(async (version) => {
    data.NALD_PARTIES.push(... await getParties(version.ACON_APAR_ID, main.FGAC_REGION_CODE));
    const contacts = await getPartyContacts(version.ACON_APAR_ID, main.FGAC_REGION_CODE);
    data.NALD_CONTACTS.push(...contacts);

    const addressIds = contacts.map(contact => contact.AADD_ID);
    data.NALD_ADDRESSES.push(...await getPartyAddresses(addressIds, main.FGAC_REGION_CODE));
  });

  data.NALD_ABS_LICENCES.push(main);
  data.NALD_ABS_LIC_VERSIONS.push(versions);
  data.NALD_REP_UNITS.push(... await getCams(main.CAMS_CODE, main.FGAC_REGION_CODE));

  console.log(data);

  return;
}

main();
