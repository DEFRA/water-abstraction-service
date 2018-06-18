// const os = require('os');
const knox = require('knox');
const childProcess = require('child_process');
const fs = require('fs');
// const Promise = require('bluebird');
// const readDir = Promise.promisify(fs.)

// const Slack = require('../../lib/slack');

// Download / unzip paths
const localPath = './temp/';
const filePath = `${localPath}nald_dl.zip`;
const finalPath = `${localPath}/NALD`;

/**
 * Runs the specified shell command
 * @param {String} shell command
 * @return {Promise} resolves if shell command exits successfully
 */
function execCommand (command) {
  console.log(command);
  return new Promise((resolve, reject) => {
    childProcess.exec(command, function (err, stdout, stderr) {
      if (err) {
        console.error(err);
        reject(new Error('child processes failed with error code: ' + err.code));
      } else {
        resolve(stdout);
      }
    });
  });
}

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

const prepare = async () => {
  await execCommand(`rm -rf ${localPath}`);
  await execCommand(`mkdir -p ${localPath}`);
};

const extract = async () => {
  await execCommand(`7z x ${localPath}nald_dl.zip -pn4ld -o${localPath}`);
  await execCommand(`7z x ${localPath}/NALD.zip -o${localPath}`);
};

function readFirstLine (path) {
  return new Promise((resolve, reject) => {
    var rs = fs.createReadStream(path, {
      encoding: 'utf8'
    });
    var acc = '';
    var pos = 0;
    var index;
    rs
      .on('data', function (chunk) {
        index = chunk.indexOf('\n');
        acc += chunk;
        index !== -1 ? rs.close() : pos += chunk.length;
      })
      .on('close', function () {
        resolve(acc.slice(0, pos + index));
      })
      .on('error', function (err) {
        reject(err);
      });
  });
}

/**
 @todo remove synchronous code
 */
async function buildSQL (request, reply) {
  var tableCreate = 'drop schema if exists "import" cascade;\nCREATE schema if not exists "import"; \n ';
  const files = await fs.readdirSync(finalPath);
  const excludeList = ['NALD_RET_LINES', 'NALD_RET_LINES_AUDIT', 'NALD_RET_FORM_LOGS', 'NALD_RET_FORM_LOGS_AUDIT'];
  for (var f in files) {
    var file = files[f];
    var table = file.split('.')[0];
    if (table.length === 0 || excludeList.indexOf(table) > -1) {
      // console.log(`SKIP ${table}`)
    } else {
      // console.log(`Process ${table}`)
      var indexableFields = [];
      var line = await readFirstLine(`${finalPath}/${table}.txt`);
      var cols = line.split(',');
      tableCreate += `\n CREATE TABLE if not exists "import"."${table}" (`;
      indexableFields = [cols[0]];
      if (cols.indexOf('FGAC_REGION_CODE') >= 0) {
        indexableFields[1] = 'FGAC_REGION_CODE';
      }
      for (var col = 0; col < cols.length; col++) {
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

  tableCreate += `\n
    delete from water.pending_import;
     insert into water.pending_import (licence_ref,status)
    select "LIC_NO",0 from import."NALD_ABS_LICENCES";`;

  fs.writeFileSync(`${__dirname}/temp/sql.sql`, tableCreate);
  return `${__dirname}/temp/sql.sql`;
}

module.exports = {
  prepare,
  download,
  extract,
  buildSQL
};
