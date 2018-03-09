const fs = require('fs');
const localPath = `${__dirname}/temp/`;
const filePath = `${localPath}nald_dl.zip`;
const finalPath = `${__dirname}/temp/NALD`;
const Slack = require('./slack');
var tableCreate = '';
async function buildSQL (request, reply) {
  tableCreate += 'drop schema if exists "import" cascade;\nCREATE schema if not exists "import"; \n ';
  console.log(finalPath);
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
  /**
  tableCreate+=`\n
    delete from water.pending_import;
     insert into water.pending_import (licence_ref,status)
    select "LIC_NO",0 from import."NALD_ABS_LICENCES";`
**/
  fs.writeFileSync(`${__dirname}/temp/sql.sql`, tableCreate);
  return `${__dirname}/temp/sql.sql`;
}
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
function execCommand (command) {
  return new Promise((resolve, reject) => {
    const childProcess = require('child_process');
    childProcess.exec(command, function (err, stdout, stderr) {
      if (err) {
        console.log(err);
        reject(new Error('child processes failed with error code: ' + err.code));
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * Process CSV data files, build SQL and import into PostGres
 * @param {Function} asyncLogger - an async logger, could be console/slack
 */
const importCSVToDatabase = async (localPath, asyncLogger) => {
  await asyncLogger('Processing data files');
  await buildSQL();
  await asyncLogger(`Loading to DB at ${process.env.PGHOST}`);
  const command = `PGPASSWORD=${process.env.PGPASSWORD} psql -h ${process.env.PGHOST} -U ${process.env.PGUSER} ${process.env.PGDATABASE} < ${localPath}/sql.sql`;
  const loaddata = await execCommand(command);
  console.log(loaddata);
  return asyncLogger('Data loaded');
};

/**
 * Async version of console.log
 * @param {Mixed} data to log
 */
const asyncConsole = async () => {
  console.log.call(arguments);
};

const loadNaldData = async (request, reply) => {
  var os = require('os');
  var hostname = os.hostname();
  await Slack.post(`Starting NALD data import on ${hostname} - ${process.env.environment} `);
  reply('Data load process started. NOTE: Progress will be reported in Slack');
  await Slack.post('Purging previous downloads');
  try {
    console.log(`purge dir ${localPath}`);
    await execCommand(`rm -rf ${localPath}`);
    console.log(`check dir ${localPath}`);
    await execCommand(`mkdir -p ${localPath}`);
    await Slack.post('Downloading from S3');
    console.log(`download from s3`);
    var s3 = await getS3();
    console.log('written ' + s3 + ' to ' + filePath);
    await Slack.post('S3 Download completed. Unzipping main archive');
    console.log('unzip top level');
    let command = `7z x ${localPath}nald_dl.zip -pn4ld -o${localPath}`;
    console.log(command);
    let res = await execCommand(command);
    console.log(res);
    await Slack.post('Unzipping secondary archive');
    console.log('unzip secondary');
    command = `7z x ${localPath}/NALD.zip -o${localPath}`;
    console.log(command);
    res = await execCommand(command);
    console.log(res);

    await importCSVToDatabase(localPath, Slack.post);

    return;
  } catch (e) {
    console.log('error ', e);
    //    return reply(e)
  }
};

const testLoadNaldData = async (request, reply) => {
  try {
    console.log('Starting dummy data import');

    // Delete files in temp folder
    let command = `rm -f ${localPath}NALD/* `;
    await execCommand(command);

    // Make temp folder
    command = `mkdir -p ${localPath}NALD`;
    await execCommand(command);

    // move dummy data files
    command = `cp ./test/dummy-csv/* ${localPath}NALD/`;
    console.log(command);
    await execCommand(command);

    await importCSVToDatabase(localPath, asyncConsole);
    return reply('Test import complete');
  } catch (e) {
    console.log('error ', e);
    //    return reply(e)
  }
};

function getS3 () {
  return new Promise((resolve, reject) => {
    const knox = require('knox');
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
const {
  Pool
} = require('pg');
const pool = new Pool({
  max: 200,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 200000
});
pool.on('connect', (client) => {
  console.log('pool.totalCount ', pool.totalCount);
  console.log('pool.idleCount ', pool.idleCount);
});
const getLicence = (request, reply) => {
  return reply(licence(request.payload.licence_number));
};
const licence = async (licenceNumber) => {
  try {
    var data = await getMain(licenceNumber);
    for (var licenceRow in data) {
      //  console.log('Licence ',licenceRow)
      //  console.log(data[licenceRow])
      var thisLicenceRow = data[licenceRow];
      thisLicenceRow.data = {};
      //  console.log('get purpose')
      thisLicenceRow.data.versions = await getVersions(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);

      console.log('versions', thisLicenceRow.data.versions);
      for (var v in thisLicenceRow.data.versions) {
        thisLicenceRow.data.versions[v].parties = await getParties(thisLicenceRow.data.versions[v].ACON_APAR_ID, thisLicenceRow.FGAC_REGION_CODE);
        for (var p in thisLicenceRow.data.versions[v].parties) {
          thisLicenceRow.data.versions[v].parties[p].contacts = await getPartyContacts(thisLicenceRow.data.versions[v].parties[p].ID, thisLicenceRow.FGAC_REGION_CODE);
        }
      }
      thisLicenceRow.data.current_version = {};
      thisLicenceRow.data.current_version.licence = (await getCurrentVersion(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE))[0];

      thisLicenceRow.data.current_version.licence.party = await getParties(thisLicenceRow.data.current_version.licence.ACON_APAR_ID, thisLicenceRow.FGAC_REGION_CODE);
      for (p in thisLicenceRow.data.current_version.licence.parties) {
        thisLicenceRow.data.current_version.licence.parties[p].contacts = await getPartyContacts(thisLicenceRow.data.current_version.licence.parties[p].ID, thisLicenceRow.FGAC_REGION_CODE);
      }
      thisLicenceRow.data.current_version.party = (await getParty(thisLicenceRow.data.current_version.licence.ACON_APAR_ID, thisLicenceRow.FGAC_REGION_CODE))[0];
      thisLicenceRow.data.current_version.address = (await getAddress(thisLicenceRow.data.current_version.licence.ACON_AADD_ID, thisLicenceRow.FGAC_REGION_CODE))[0];
      thisLicenceRow.data.current_version.original_effective_date = dateToSortableString(thisLicenceRow.ORIG_EFF_DATE);
      thisLicenceRow.data.current_version.version_effective_date = dateToSortableString(thisLicenceRow.data.current_version.licence.EFF_ST_DATE);
      thisLicenceRow.data.current_version.expiry_date = dateToSortableString(thisLicenceRow.EXPIRY_DATE);

      thisLicenceRow.data.current_version.purposes = await getPurposes(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE, thisLicenceRow.data.current_version.licence.ISSUE_NO, thisLicenceRow.data.current_version.licence.INCR_NO);
      for (var pu in thisLicenceRow.data.current_version.purposes) {
        thisLicenceRow.data.current_version.purposes[pu].purpose = await getPurpose({
          primary: thisLicenceRow.data.current_version.purposes[pu].APUR_APPR_CODE,
          secondary: thisLicenceRow.data.current_version.purposes[pu].APUR_APSE_CODE,
          tertiary: thisLicenceRow.data.current_version.purposes[pu].APUR_APUS_CODE
        });
        thisLicenceRow.data.current_version.purposes[pu].purposePoints = await getPurposePoints(thisLicenceRow.data.current_version.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
        thisLicenceRow.data.current_version.purposes[pu].licenceAgreements = await getPurposePointLicenceAgreements(thisLicenceRow.data.current_version.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
        thisLicenceRow.data.current_version.purposes[pu].licenceConditions = await getPurposePointLicenceConditions(thisLicenceRow.data.current_version.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
      }

      thisLicenceRow.data.cams = await getCams(thisLicenceRow.CAMS_CODE, thisLicenceRow.FGAC_REGION_CODE);
      //  console.log('get roles')
      thisLicenceRow.data.roles = await getRoles(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);
      //  console.log('get points')
      thisLicenceRow.data.purposes = await getPurposes(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);
      for (pu in thisLicenceRow.data.purposes) {
        thisLicenceRow.data.purposes[pu].purpose = await getPurpose({
          primary: thisLicenceRow.data.purposes[pu].APUR_APPR_CODE,
          secondary: thisLicenceRow.data.purposes[pu].APUR_APSE_CODE,
          tertiary: thisLicenceRow.data.purposes[pu].APUR_APUS_CODE
        });
        thisLicenceRow.data.purposes[pu].purpose = thisLicenceRow.data.purposes[pu].purpose[0];
        thisLicenceRow.data.purposes[pu].purposePoints = await getPurposePoints(thisLicenceRow.data.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
        thisLicenceRow.data.purposes[pu].licenceAgreements = await getPurposePointLicenceAgreements(thisLicenceRow.data.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
        thisLicenceRow.data.purposes[pu].licenceConditions = await getPurposePointLicenceConditions(thisLicenceRow.data.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
      }
      //  console.log(JSON.stringify(thisLicenceRow))
      return thisLicenceRow;
    }
    // process.exit()
  } catch (e) {
    console.log(e);
  }
};
function dateToSortableString (str) {
  const moment = require('moment');
  var d = moment(str, 'DD/MM/YYYY');
  if (d.isValid()) {
    return d.format('YYYYMMDD');
  } else {
    return null;
  }
}
const getMain = async (licenceNo) => {
  const client = await pool.connect();
  const res = await client.query(`
    select * from import.
    -- "NALD_ABSTAT_WFD_DATA"
    "NALD_ABS_LICENCES"
    where "LIC_NO"=$1
    `, [licenceNo]);
  client.release();
  return res.rows;
};
const getCams = async (code, FGAC_REGION_CODE) => {
  //  console.log('getCams ',code)
  const client = await pool.connect();
  //  console.log('getCams - got client')
  const res = await client.query(`
    select * from import."NALD_REP_UNITS"
    where "CODE"=$1 and "FGAC_REGION_CODE" = $2
    `, [code, FGAC_REGION_CODE]);
  //  console.log('getCams - pre release')
  client.release();
  //  console.log('getCams - release')
  return res.rows;
};
const getCurrentVersion = async (licenceId, FGAC_REGION_CODE) => {
  const client = await pool.connect();
  const res = await client.query(`
    SELECT
      *
    FROM
      import."NALD_ABS_LIC_VERSIONS"
      JOIN import."NALD_WA_LIC_TYPES" ON "NALD_ABS_LIC_VERSIONS"."WA_ALTY_CODE" = "NALD_WA_LIC_TYPES"."CODE"
    WHERE
      "AABL_ID" = $1
      AND "FGAC_REGION_CODE" = $2
      AND (
      0 = 0
      AND "EFF_END_DATE" = 'null'
      OR to_date( "EFF_END_DATE", 'DD/MM/YYYY' ) > now()
      )
      AND ( 0 = 0 -- and "EFF_ST_DATE" = 'null'--  OR to_date( "EFF_ST_DATE", 'DD/MM/YYYY' ) <= now()
      )
      AND "NALD_ABS_LIC_VERSIONS"."STATUS" = 'CURR'
    ORDER BY
      "ISSUE_NO" DESC,
      "INCR_NO" DESC
      LIMIT 1
    `, [licenceId, FGAC_REGION_CODE]);
  //  console.log('getCams - pre release')
  client.release();
  //  console.log('getCams - release')

  return res.rows;
};
const getVersions = async (licenceId, FGAC_REGION_CODE) => {
  //  console.log('getCams ',code)
  const client = await pool.connect();
  //  console.log('getCams - got client')
  const res = await client.query(`
    select * from import."NALD_ABS_LIC_VERSIONS"
--     JOIN NALD_WA_LIC_TYPES ON "NALD_ABS_LIC_VERSIONS"."WA_ALTY_CODE"="NALD_WA_LIC_TYPES"."CODE"
    where "AABL_ID"=$1 and "FGAC_REGION_CODE" = $2
    `, [licenceId, FGAC_REGION_CODE]);
  //  console.log('getCams - pre release')
  client.release();
  //  console.log('getCams - release')
  return res.rows;
};
const getParties = async (ID, FGAC_REGION_CODE) => {
  const client = await pool.connect();
  const res = await client.query(`
    select
    p.*
    from
    import."NALD_PARTIES" p
    where p."ID"=$1 and "FGAC_REGION_CODE" = $2
  `, [ID, FGAC_REGION_CODE]);
  client.release();
  return res.rows;
};
const getPartyContacts = async (APAR_ID, FGAC_REGION_CODE) => {
  const client = await pool.connect();
  var query = `
    select
    c.*,
    row_to_json(a.*) AS party_address
    from
    import."NALD_CONTACTS" c
    left join import."NALD_ADDRESSES" a
    on a."ID"=c."AADD_ID"
    where c."APAR_ID"=$1 and c."FGAC_REGION_CODE" = $2 and a."FGAC_REGION_CODE" = $2
  `;
  //  console.log(query)
  //  console.log(APAR_ID,FGAC_REGION_CODE)
  const res = await client.query(query, [APAR_ID, FGAC_REGION_CODE]);
  //  console.log('ok')
  client.release();
  return res.rows;
};
const getParty = async (APAR_ID, FGAC_REGION_CODE) => {
  const client = await pool.connect();
  const res = await client.query(`
    select p.* from
    import."NALD_PARTIES" p
    where "ID"=$1 and "FGAC_REGION_CODE" = $2
  `, [APAR_ID, FGAC_REGION_CODE]);
  client.release();
  return res.rows;
};
const getAddress = async (AADD_ID, FGAC_REGION_CODE) => {
  const client = await pool.connect();
  const res = await client.query(`
    select
    a.*
    from import."NALD_ADDRESSES" a
    where "ID"=$1 and "FGAC_REGION_CODE" = $2
  `, [AADD_ID, FGAC_REGION_CODE]);
  client.release();
  return res.rows;
};
const getRoles = async (AABL_ID, FGAC_REGION_CODE) => {
  //  console.log('AABL_ID ',AABL_ID)
  const client = await pool.connect();
  const res = await client.query(`
    select row_to_json(r.*) AS role_detail,
          row_to_json(t.*) AS role_type,
          row_to_json(p.*) AS role_party,
          row_to_json(a.*) AS role_address,

          ARRAY(
          select
          row_to_json(x.*) AS contact_data from (
            SELECT
            *
            from import."NALD_CONT_NOS" c
            left join import."NALD_CONT_NO_TYPES" ct on c."ACNT_CODE"=ct."CODE"
            where r."ACON_APAR_ID"=c."ACON_APAR_ID" and r."ACON_AADD_ID" = c."ACON_AADD_ID"
            and c."FGAC_REGION_CODE" = $2

          ) x
          )

          from
          import."NALD_LIC_ROLES" r
          left join import."NALD_LIC_ROLE_TYPES" t on r."ALRT_CODE"=t."CODE"
          left join import."NALD_PARTIES" p on r."ACON_APAR_ID"=p."ID"
          left join import."NALD_ADDRESSES" a on r."ACON_AADD_ID"=a."ID"



          where

      r."AABL_ID"=$1
      and r."FGAC_REGION_CODE" = $2
      and p."FGAC_REGION_CODE" = $2
      and a."FGAC_REGION_CODE" = $2
      AND (r."EFF_END_DATE" = 'null'
      OR to_date( r."EFF_END_DATE", 'DD/MM/YYYY' ) > now()
      )
  `, [AABL_ID, FGAC_REGION_CODE]);
  client.release();
  return res.rows;
};
const getPurposes = async (licenceId, FGAC_REGION_CODE, ISSUE_NO, INCR_NO) => {
  //  console.log('purpose ',purpose)
  const client = await pool.connect();
  let res;
  if (ISSUE_NO && INCR_NO) {
    const params = [licenceId, FGAC_REGION_CODE, ISSUE_NO, INCR_NO];
    console.log('p1', params);
    try {
      res = await client.query(`
          select
                *
          from
          import."NALD_ABS_LIC_PURPOSES" p
          where p."AABV_AABL_ID"=$1 and "FGAC_REGION_CODE" = $2 and "AABV_ISSUE_NO"=$3  and "AABV_INCR_NO" = $4
      `, params);
      console.log('p1 done');
    } catch (e) {
      console.log(e);
    }
  } else {
    const params = [licenceId, FGAC_REGION_CODE];
    console.log('p2', params);
    try {
      res = await client.query(`
          select
                *
          from
          import."NALD_ABS_LIC_PURPOSES" p
          where p."AABV_AABL_ID"=$1 and "FGAC_REGION_CODE" = $2
      `, params);
      console.log('p2 done');
    } catch (e) {
      console.log(e);
    }
  }

  client.release();
  console.log(res.error);
  return res.rows;
};
const getPurposePoints = async (purposeId, FGAC_REGION_CODE) => {
  const client = await pool.connect();
  const res = await client.query(`
        select
              pp.*,
              row_to_json(m.*) AS means_of_abstraction,
              row_to_json(p.*) AS point_detail,
              row_to_json(s.*) AS point_source
              from
              import."NALD_ABS_PURP_POINTS" pp
              left join import."NALD_MEANS_OF_ABS" m on m."CODE"=pp."AMOA_CODE"
              left join import."NALD_POINTS" p on p."ID"=pp."AAIP_ID"
              left join import."NALD_SOURCES" s on s."CODE"=p."ASRC_CODE"
        where pp."AABP_ID"=$1 and pp."FGAC_REGION_CODE" = $2 and p."FGAC_REGION_CODE" = $2
    `, [purposeId, FGAC_REGION_CODE]);
  client.release();
  return res.rows;
};
const getPurpose = async (purpose) => {
  //  console.log('purpose ',purpose)
  const client = await pool.connect();
  const res = await client.query(`
      select
            row_to_json(p1.*) AS purpose_primary,
            row_to_json(p2.*) AS purpose_secondary,
            row_to_json(p3.*) AS purpose_tertiary
      from
      import."NALD_PURP_PRIMS" p1
      left join import."NALD_PURP_SECS" p2 on p2."CODE"=$2
      left join import."NALD_PURP_USES" p3 on p3."CODE"=$3
      where p1."CODE"=$1
  `, [purpose.primary, purpose.secondary, purpose.tertiary]);
  client.release();
  return res.rows;
};
// const getPoints = async (AAIP_ID, NGR1_SHEET) => {
//   //  console.log('AAIP_ID ',AAIP_ID,' NGR1_SHEET ',NGR1_SHEET)
//   const client = await pool.connect();
//   const res = await client.query(`
//       select
//       row_to_json(p.*) AS point,
//       row_to_json(pc.*) AS point_category,
//       row_to_json(ptp.*) AS point_type_primary,
//       row_to_json(pts.*) AS point_type_secondary,
//       row_to_json(s.*) AS source
//       from import."NALD_POINTS" p
//       left join import."NALD_SOURCES" s on s."CODE"=p."ASRC_CODE"
//       left join import."NALD_POINT_CATEGORIES" pc on pc."CODE"=p."AAPC_CODE"
//       left join import."NALD_POINT_TYPE_PRIMS" ptp on ptp."CODE"=p."AAPT_APTP_CODE"
//       left join import."NALD_POINT_TYPE_SECS" pts on pts."CODE"=p."AAPT_APTS_CODE"
//       where "ID"=$1 and "NGR1_SHEET"=$2
//   `, [AAIP_ID, NGR1_SHEET]);
//   //  console.log('done')
//   client.release();
//   return res.rows;
// };
// const getPointAbstractionMethods = async (AAIP_ID, FGAC_REGION_CODE) => {
//   //  console.log('AAIP_ID ',AAIP_ID)
//   const client = await pool.connect();
//   const res = await client.query(`
//       select pp.*,
//       row_to_json(m.*) AS means_of_abstraction
//       from import."NALD_ABS_PURP_POINTS" pp
//       left join import."NALD_MEANS_OF_ABS" m on m."CODE"=pp."AMOA_CODE"
//       where pp."AAIP_ID"=$1 and pp."FGAC_REGION_CODE" = $2
//   `, [AAIP_ID, FGAC_REGION_CODE]);
//   //  console.log('done')
//   client.release();
//   return res.rows;
// };
const getPurposePointLicenceAgreements = async (AABP_ID, FGAC_REGION_CODE) => {
  // console.log('AABP_ID (1) ', AABP_ID)
  const client = await pool.connect();
  const res = await client.query(`
      select * from import."NALD_LIC_AGRMNTS"
      where "AABP_ID"=$1 and "FGAC_REGION_CODE" = $2
  `, [AABP_ID, FGAC_REGION_CODE]);
  client.release();
  return res.rows;
};
const getPurposePointLicenceConditions = async (AABP_ID, FGAC_REGION_CODE) => {
  // console.log('AABP_ID (2) ', AABP_ID)
  try {
    const client = await pool.connect();
    const res = await client.query(`
      select c.*,
      row_to_json(ct.*) AS condition_type
      from import."NALD_LIC_CONDITIONS" c
      left join import."NALD_LIC_COND_TYPES" ct on ct."CODE"=c."ACIN_CODE" and ct."SUBCODE"=c."ACIN_SUBCODE"
      where "AABP_ID"=$1 and c."FGAC_REGION_CODE" = $2
      order by "DISP_ORD" asc
  `, [AABP_ID, FGAC_REGION_CODE]);
    client.release();
    return res.rows;
  } catch (e) {
    console.log(e);
    return null;
  }
};
module.exports = {
  import: loadNaldData,
  importTest: testLoadNaldData,
  licence,
  getLicence
};
