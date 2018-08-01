const readFirstLine = require('firstline');
const { dbQuery } = require('./lib/db');
const fs = require('fs');
const path = require('path');
const { intersection } = require('lodash');
const { promisify } = require('util');
const config = require('../../../config.js');
const { execCommand } = require('../../lib/helpers.js');
const Slack = require('../../lib/slack');

const readDir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);

const { download: s3Download } = require('./lib/s3-download.js');

// Download / unzip paths
const localPath = './temp/';
const filePath = path.join(localPath, 'nald_dl.zip');
const finalPath = path.join(localPath, 'NALD');

/**
 * Prepares for import by removing files from tempory folder and creating directory
 */
const prepare = async () => {
  await execCommand(`rm -rf ${localPath}`);
  await execCommand(`mkdir -p ${localPath}`);
  await execCommand(`mkdir -p ${finalPath}`);
};

/**
 * Downloads latest ZIP file from S3 bucket
 * @return {Promise} resolves when download complete
 */
const download = async () => {
  const remotePath = path.join('nald_dump', 'nald_enc.zip');
  return s3Download(remotePath, filePath);
};

/**
 * Extracts files from zip downloaded from S3 bucket
 */
const extract = async () => {
  const primaryPath = path.join(localPath, 'nald_dl.zip');
  const secondaryPath = path.join(localPath, 'NALD.zip');
  await execCommand(`7z x ${primaryPath} -pn4ld -o${localPath}`);
  await execCommand(`7z x ${secondaryPath} -o${localPath}`);
};

/**
 * Get a list of files to import
 * @return {Promise} resolves with array of files
 */
async function getImportFiles () {
  const files = await readDir(finalPath);
  const excludeList = ['NALD_RET_LINES_AUDIT', 'NALD_RET_FORM_LOGS_AUDIT'];
  return files.filter((file) => {
    const table = file.split('.')[0];
    const extn = file.split('.')[1];
    return !(table.length === 0 || excludeList.includes(table)) && extn === 'txt';
  });
}

/**
 * Drops and creates the import schema ready to import the CSVs as tables
 * @return {Promise}
 */
async function dropAndCreateSchema () {
  await dbQuery('DROP SCHEMA IF EXISTS "import" CASCADE');
  await dbQuery('CREATE schema if not exists "import"');
}

/**
 * Gets import SQL for single file in import
 * @param {String} file - the CSV file to import
 * @return {String} the SQL statements to import the CSV file
 */
async function getSqlForFile (file) {
  const indexableFieldsList = ['ID', 'LIC_NO ', 'FGAC_REGION_CODE', 'CODE ', 'AABL_ID', 'WA_ALTY_CODE', 'EFF_END_DATE', 'EFF_ST_DATE', 'STATUS', 'EXPIRY_DATE', 'LAPSED_DATE', 'REV_DATE', 'ISSUE_NO', 'INCR_NO', 'AADD_ID', 'APAR_ID', 'ACNT_CODE', 'ACON_APAR_ID', 'ACON_AADD_ID', 'ALRT_CODE', 'AABV_AABL_ID', 'AABV_ISSUE_NO', 'AABV_INCR_NO', 'AMOA_CODE', 'AAIP_ID', 'ASRC_CODE', 'AABP_ID', 'ACIN_CODE', 'ACIN_SUBCODE', 'DISP_ORD', 'ARTY_ID', 'ARFL_ARTY_ID', 'ARFL_DATE_FROM'];

  let table = file.split('.')[0];

  const tablePath = path.join(finalPath, `${table}.txt`);

  let line = await readFirstLine(tablePath);
  let cols = line.split(',');

  let tableCreate = `\n CREATE TABLE if not exists "import"."${table}" (`;

  for (let col = 0; col < cols.length; col++) {
    tableCreate += `"${cols[col]}" varchar`;
    if (cols.length === (col + 1)) {
      tableCreate += `);`;
    } else {
      tableCreate += `, `;
    }
  }

  const indexableFields = intersection(indexableFieldsList, cols);

  for (let field of indexableFields) {
    const indexName = `${table}_${field}_index`;
    tableCreate += `\ndrop INDEX  if exists "${indexName}";`;
  }
  tableCreate += `\n \\copy "import"."${table}" FROM '${finalPath}/${file}' HEADER DELIMITER ',' CSV;`;
  for (let field of indexableFields) {
    const indexName = `${table}_${field}_index`;
    tableCreate += `\nCREATE INDEX "${indexName}" ON "import"."${table}" ("${field}");`;
  }

  return tableCreate;
}

/**
 * Imports a single CSV file
 * @param {String} the CSV filename
 * @return {Promise}
 */
async function importFiles () {
  const files = await getImportFiles();
  const sqlPath = path.join(finalPath, 'sql.sql');

  for (let file of files) {
    console.log(`Importing ${file} to PostGres`);
    const sql = await getSqlForFile(file);
    await writeFile(sqlPath, sql);
    await execCommand(`psql ${config.pg.connectionString} < ${sqlPath}`);
  }
}

/**
 * The download/extract tasks have been combined into a single task
 * since they are currently running on the local file system, so must all
 * run on the same instance
 * @return {Promise}
 */
const downloadAndExtract = async () => {
  await Slack.post('Import: preparing folders');
  await prepare();

  // Download from S3
  await Slack.post('Import: downloading from S3');
  await download();
  // Extract files from zip
  await Slack.post('Import: extracting files from zip');
  await extract();

  await Slack.post('Import: drop/create import schema');
  await dropAndCreateSchema();

  await Slack.post('Import: importing CSV files');
  await importFiles();

  await Slack.post('Import: CSV loaded');

  await prepare();
  await Slack.post('Import: cleaned up local files');
};

/**
 * Move test files
 * For the purposes of unit testing, this copies dummy CSV files from a test
 * folder to the import folder ready for the import script
 * @return {Promise} resolves when command completes
 */
const copyTestFiles = async () => {
  await prepare();
  await dropAndCreateSchema();

  // move dummy data files
  await execCommand(`cp ./test/dummy-csv/* ${finalPath}`);

  // Import CSV
  return importFiles();
};

module.exports = {
  copyTestFiles,
  downloadAndExtract
};
