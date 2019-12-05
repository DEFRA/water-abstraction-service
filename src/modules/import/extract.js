const readFirstLine = require('firstline');
const { dbQuery } = require('./lib/db');
const fs = require('fs');
const path = require('path');
const { intersection } = require('lodash');
const { promisify } = require('util');
const config = require('../../../config.js');
const { execCommand } = require('../../lib/helpers.js');
const Slack = require('../../lib/slack');
const { logger } = require('../../logger');

const readDir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);

const s3 = require('../../lib/connectors/s3');

// Download / unzip paths
const localPath = './temp/';
const filePath = path.join(localPath, 'nald_dl.zip');
const finalPath = path.join(localPath, 'NALD');

const SCHEMA_IMPORT = 'import';
const SCHEMA_TEMP = 'import_temp';

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
  return s3.download(remotePath, filePath);
};

const extractArchive = async (source, destination, password) => {
  let command = `7z x ${source} -o${destination}`;
  if (password) {
    command += ` -p${password}`;
  }
  await execCommand(command);
};

/**
 * Extracts files from zip downloaded from S3 bucket
 */
const extract = async () => {
  const primaryPath = path.join(localPath, 'nald_dl.zip');
  const secondaryPath = path.join(localPath, 'NALD.zip');

  logger.info('Extracting data from NALD zip file');

  try {
    await extractArchive(primaryPath, localPath, process.env.NALD_ZIP_PASSWORD);
    await extractArchive(secondaryPath, localPath);
  } catch (err) {
    logger.error('Could not extract NALD zip', err);
  }
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

const dropSchema = name => dbQuery(`drop schema if exists ${name} cascade`);
const createSchema = name => dbQuery(`create schema if not exists ${name}`);
const renameSchema = (from, to) => dbQuery(`alter schema ${from} rename to ${to};`);

/**
 * Drops and creates the import schema ready to import the CSVs as tables
 * @schemaName {String} The name of the schema to recreate.
 * @return {Promise}
 */
async function dropAndCreateSchema (schemaName = SCHEMA_IMPORT) {
  await dropSchema(schemaName);
  await createSchema(schemaName);
}

const swapTemporarySchema = async () => {
  await dropSchema(SCHEMA_IMPORT);
  await renameSchema(SCHEMA_TEMP, SCHEMA_IMPORT);
};

/**
 * Gets import SQL for single file in import
 * @param {String} file - the CSV file to import
 * @return {String} the SQL statements to import the CSV file
 */
async function getSqlForFile (file, schemaName) {
  const indexableFieldsList = ['ID', 'LIC_NO', 'FGAC_REGION_CODE', 'CODE ', 'AABL_ID', 'WA_ALTY_CODE', 'EFF_END_DATE', 'EFF_ST_DATE', 'STATUS', 'EXPIRY_DATE', 'LAPSED_DATE', 'REV_DATE', 'ISSUE_NO', 'INCR_NO', 'AADD_ID', 'APAR_ID', 'ACNT_CODE', 'ACON_APAR_ID', 'ACON_AADD_ID', 'ALRT_CODE', 'AABV_AABL_ID', 'AABV_ISSUE_NO', 'AABV_INCR_NO', 'AMOA_CODE', 'AAIP_ID', 'ASRC_CODE', 'AABP_ID', 'ACIN_CODE', 'ACIN_SUBCODE', 'DISP_ORD', 'ARTY_ID', 'ARFL_ARTY_ID', 'ARFL_DATE_FROM'];

  const table = file.split('.')[0];
  const tablePath = path.join(finalPath, `${table}.txt`);
  const line = await readFirstLine(tablePath);
  const cols = line.split(',');

  let tableCreate = `\n CREATE TABLE if not exists ${schemaName}."${table}" (`;

  for (let col = 0; col < cols.length; col++) {
    tableCreate += `"${cols[col]}" varchar`;
    if (cols.length === (col + 1)) {
      tableCreate += ');';
    } else {
      tableCreate += ', ';
    }
  }

  const indexableFields = intersection(indexableFieldsList, cols);

  for (const field of indexableFields) {
    const indexName = `${table}_${field}_index`;
    tableCreate += `\ndrop INDEX  if exists "${indexName}";`;
  }
  tableCreate += `\n \\copy ${schemaName}."${table}" FROM '${finalPath}/${file}' HEADER DELIMITER ',' CSV;`;
  for (const field of indexableFields) {
    const indexName = `${table}_${field}_index`;
    tableCreate += `\nCREATE INDEX "${indexName}" ON ${schemaName}."${table}" ("${field}");`;
  }

  return tableCreate;
}

/**
 * Imports a single CSV file
 * @param {String} the CSV filename
 * @return {Promise}
 */
async function importFiles (schemaName) {
  const files = await getImportFiles();
  const sqlPath = path.join(finalPath, 'sql.sql');

  for (const file of files) {
    logger.info(`Importing ${file} to PostGres`);
    const sql = await getSqlForFile(file, schemaName);

    await writeFile(sqlPath, sql);
    await execCommand(`psql ${config.pg.connectionString} < ${sqlPath}`);
  }
}

const logToConsoleAndSlack = message => {
  Slack.post(message);
  logger.info(message);
};

/**
 * The download/extract tasks have been combined into a single task
 * since they are currently running on the local file system, so must all
 * run on the same instance
 * @return {Promise}
 */
const downloadAndExtract = async () => {
  logToConsoleAndSlack('Import: preparing folders');
  await prepare();

  logToConsoleAndSlack('Import: downloading from S3');
  await download();

  logToConsoleAndSlack('Import: extracting files from zip');
  await extract();

  logToConsoleAndSlack('Import: create import_temp schema');
  await dropAndCreateSchema(SCHEMA_TEMP);

  logToConsoleAndSlack('Import: importing CSV files');
  await importFiles(SCHEMA_TEMP);
  logToConsoleAndSlack('Import: CSV loaded');

  logToConsoleAndSlack('Import: swapping schema from import_temp to import');
  await swapTemporarySchema();

  await prepare();
  logToConsoleAndSlack('Import: cleaned up local files');
};

/**
 * Move test files
 * For the purposes of unit testing, this copies dummy CSV files from a test
 * folder to the import folder ready for the import script
 * @return {Promise} resolves when command completes
 */
const copyTestFiles = async () => {
  await prepare();
  await dropAndCreateSchema(SCHEMA_IMPORT);

  // move dummy data files
  await execCommand(`cp ./test/dummy-csv/* ${finalPath}`);

  // Import CSV
  return importFiles(SCHEMA_IMPORT);
};

exports.copyTestFiles = copyTestFiles;
exports.downloadAndExtract = downloadAndExtract;
