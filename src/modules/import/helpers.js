// const os = require('os');
const knox = require('knox');
const childProcess = require('child_process');
const fs = require('fs');
const { promisify } = require('util');
const readDir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);
const readFirstLine = require('firstline');

// Download / unzip paths
const localPath = './temp/';
const filePath = `${localPath}nald_dl.zip`;
const finalPath = `${localPath}/NALD`;

const execCommand = (cmd) => {
  console.log(cmd);
  return promisify(childProcess.exec)(cmd);
};

const config = require('../../../config.js');

/**
 * Runs the specified shell command
 * @param {String} shell command
 * @return {Promise} resolves if shell command exits successfully
 */
// function execCommand (command) {
//   console.log(command);
//
//
//
//   return promisify(childProcess.exec)(command);
//
//   return new Promise((resolve, reject) => {
//     childProcess.exec(command, function (err, stdout, stderr) {
//       if (err) {
//         console.error(err);
//         reject(new Error('child processes failed with error code: ' + err.code));
//       } else {
//         resolve(stdout);
//       }
//     });
//   });
// }

/**
 * Downloads latest ZIP file from S3 bucket
 * @return {Promise} resolves when download complete
 */
function download () {
  return new Promise((resolve, reject) => {
    var knoxConfig = {
      key: process.env.s3_key,
      secret: process.env.s3_secret,
      region: 'eu-west-1',
      bucket: process.env.s3_bucket
    };
    if (process.env.proxy) {
      console.log('proxy: ' + process.env.proxy);
      var ProxyAgent = require('proxy-agent');
      knoxConfig.agent = new ProxyAgent(process.env.proxy);
    } else {
      console.log('no proxy');
    }
    // knoxConfig.agent=require("https").globalAgent
    var client = knox.createClient(knoxConfig);
    var file = require('fs').createWriteStream(filePath);
    const s3file = 'nald_dump/nald_enc.zip';
    client.getFile(s3file, function (err, stream) {
      if (err) {
        throw err;
      }
      stream.on('data', function (chunk) {
        file.write(chunk);
      });
      stream.on('end', function (chunk) {
        file.end();
        resolve(filePath);
      });
    });
  });
}

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
 * Builds SQL file to create tables for NALD import
 */
async function buildSQL (request, reply) {
  let tableCreate = 'drop schema if exists "import" cascade;\nCREATE schema if not exists "import"; \n ';
  const files = await readDir(finalPath);
  const excludeList = ['NALD_RET_LINES', 'NALD_RET_LINES_AUDIT', 'NALD_RET_FORM_LOGS', 'NALD_RET_FORM_LOGS_AUDIT'];
  for (let f in files) {
    let file = files[f];
    let table = file.split('.')[0];
    if (table.length === 0 || excludeList.indexOf(table) > -1) {
      // console.log(`SKIP ${table}`)
    } else {
      // console.log(`Process ${table}`)
      let indexableFields = [];
      let line = await readFirstLine(`${finalPath}/${table}.txt`);
      let cols = line.split(',');
      tableCreate += `\n CREATE TABLE if not exists "import"."${table}" (`;
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
      console.log('-------');
      console.log(cols);
      console.log(indexableFields);
      tableCreate += `\ndrop INDEX  if exists "${table}_index";`;
      tableCreate += `\nCREATE INDEX "${table}_index" ON "import"."${table}" USING btree(${'"' + indexableFields.join('","') + '"'});`;
      tableCreate += `\n \\copy "import"."${table}" FROM '${finalPath}/${file}' HEADER DELIMITER ',' CSV;`;
    }
  };

  // tableCreate += `\n
  //   delete from water.pending_import;
  //    insert into water.pending_import (licence_ref,status)
  //   select "LIC_NO",0 from import."NALD_ABS_LICENCES";`;

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
