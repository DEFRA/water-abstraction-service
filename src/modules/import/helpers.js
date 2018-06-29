const readFirstLine = require('firstline');
const childProcess = require('child_process');
const fs = require('fs');
const { promisify } = require('util');
const config = require('../../../config.js');

const readDir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);

const { download: s3Download } = require('./s3-download.js');

// Download / unzip paths
const localPath = './temp/';
const filePath = `${localPath}nald_dl.zip`;
const finalPath = `${localPath}/NALD`;

const execCommand = (cmd) => {
  console.log(cmd);
  return promisify(childProcess.exec)(cmd);
};

/**
 * Downloads latest ZIP file from S3 bucket
 * @return {Promise} resolves when download complete
 */
const download = async () => {
  return s3Download('nald_dump/nald_enc.zip', filePath);
};

/**
 * Prepares for import by removing files from tempory folder and creating directory
 */
const prepare = async () => {
  await execCommand(`rm -rf ${localPath}`);
  await execCommand(`mkdir -p ${localPath}`);
};

/**
 * Extracts files from zip downloaded from S3 bucket
 */
const extract = async () => {
  await execCommand(`7z x ${localPath}nald_dl.zip -pn4ld -o${localPath}`);
  await execCommand(`7z x ${localPath}/NALD.zip -o${localPath}`);
};

/**
 * Get a list of files to import
 * @return {Promise} resolves with array of files
 */
async function getImportFiles () {
  const files = await readDir(finalPath);
  const excludeList = ['NALD_RET_LINES', 'NALD_RET_LINES_AUDIT', 'NALD_RET_FORM_LOGS', 'NALD_RET_FORM_LOGS_AUDIT'];
  return files.filter((file) => {
    const table = file.split('.')[0];
    return !(table.length === 0 || excludeList.includes(table));
  });
}

/**
 * Gets import SQL for single file in import
 * @param {String} file - the CSV file to import
 * @return {String} the SQL statements to import the CSV file
 */
async function getSqlForFile (file) {
  let table = file.split('.')[0];

  // console.log(`Process ${table}`)
  let indexableFields = [];
  let line = await readFirstLine(`${finalPath}/${table}.txt`);
  let cols = line.split(',');
  let tableCreate = `\n CREATE TABLE if not exists "import"."${table}" (`;
  indexableFields = [cols[0]];
  if (cols.indexOf('FGAC_REGION_CODE') >= 0) {
    indexableFields[1] = 'FGAC_REGION_CODE';
  }
  for (let col = 0; col < cols.length; col++) {
    tableCreate += `"${cols[col]}" varchar`;
    if (cols.length === (col + 1)) {
      tableCreate += `);`;
    } else {
      tableCreate += `, `;
    }
  }
  tableCreate += `\ndrop INDEX  if exists "${table}_index";`;
  tableCreate += `\nCREATE INDEX "${table}_index" ON "import"."${table}" USING btree(${'"' + indexableFields.join('","') + '"'});`;
  tableCreate += `\n \\copy "import"."${table}" FROM '${finalPath}/${file}' HEADER DELIMITER ',' CSV;`;
  return tableCreate;
}

/**
 * Builds SQL file to create tables for NALD import
 */
async function buildSQL (request, reply) {
  let tableCreate = 'drop schema if exists "import" cascade;\nCREATE schema if not exists "import"; \n ';
  const files = await getImportFiles();
  for (let file of files) {
    tableCreate += await getSqlForFile(file);
  };

  await writeFile(`${finalPath}/sql.sql`, tableCreate);
  return `${finalPath}/sql.sql`;
}

/**
 * Process CSV data files, build SQL and import into PostGres
 * @param {Function} asyncLogger - an async logger, could be console/slack
 */
const importCSVToDatabase = () => {
  return execCommand(`psql ${config.pg.connectionString} < ${finalPath}/sql.sql`);
};

module.exports = {
  prepare,
  download,
  extract,
  buildSQL,
  importCSVToDatabase
};
