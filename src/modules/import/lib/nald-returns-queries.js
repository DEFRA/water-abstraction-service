const moment = require('moment');
const { dbQuery } = require('./db');

/**
 * Gets form logs for specified licence number
 * @param {String} licenceNumber
 * @return {Promise} resolves with array of DB records
 */
const getFormats = (licenceNumber) => {
  const query = `
  SELECT f.*, v.* FROM "import"."NALD_ABS_LICENCES" l
  LEFT JOIN "import"."NALD_RET_FORMATS" f ON l."ID"=f."ARVN_AABL_ID" AND l."FGAC_REGION_CODE"=f."FGAC_REGION_CODE"
  JOIN "import"."NALD_RET_VERSIONS" v ON f."ARVN_VERS_NO"=v."VERS_NO" AND f."ARVN_AABL_ID"=v."AABL_ID" AND f."FGAC_REGION_CODE"=v."FGAC_REGION_CODE"
  WHERE l."LIC_NO"=$1
  ORDER BY to_date(v."EFF_ST_DATE", 'DD/MM/YYYY')`;
  const params = [licenceNumber];
  return dbQuery(query, params);
};

/**
 * Get purposes attached to a returns format
 * @param {Number} formatId - the ARTY_ID=
 * @param {Number} region code - FGAC_REGION_CODE
 * @return {Promise} resolves with array of DB records
 */
const getFormatPurposes = (formatId, regionCode) => {
  const query = `
  SELECT p.*,
  p1."DESCR" AS primary_purpose,
  p2."DESCR" AS secondary_purpose,
  p3."DESCR" AS tertiary_purpose
  FROM "import"."NALD_RET_FMT_PURPOSES" p
  LEFT JOIN "import"."NALD_PURP_PRIMS" p1 ON p."APUR_APPR_CODE"=p1."CODE"
  LEFT JOIN "import"."NALD_PURP_SECS" p2 ON p."APUR_APSE_CODE"=p2."CODE"
  LEFT JOIN "import"."NALD_PURP_USES" p3 ON p."APUR_APUS_CODE"=p3."CODE"
  WHERE p."ARTY_ID"=$1 AND p."FGAC_REGION_CODE"=$2`;
  const params = [formatId, regionCode];
  return dbQuery(query, params);
};

/**
 * Get points attached to a returns format
 * @param {Number} formatId - the ARTY_ID=
 * @param {Number} region code - FGAC_REGION_CODE
 * @return {Promise} resolves with array of DB records
 */
const getFormatPoints = (formatId, regionCode) => {
  const query = `
  SELECT p.*
  FROM "import"."NALD_RET_FMT_POINTS" fp
  LEFT JOIN "import"."NALD_POINTS" p ON fp."AAIP_ID"=p."ID" AND fp."FGAC_REGION_CODE"=p."FGAC_REGION_CODE"
  WHERE fp."ARTY_ID"=$1 AND fp."FGAC_REGION_CODE"=$2`;
  const params = [formatId, regionCode];
  return dbQuery(query, params);
};

/**
 * Get form logs for specified return format
 * @param {Number} formatId - the ARTY_ID
 * @return {Promise} resolves with array of DB records
 */
const getLogs = (formatId, regionCode) => {
  const query = `
  SELECT l.* FROM "import"."NALD_RET_FORM_LOGS" l
  WHERE l."ARTY_ID"=$1 AND l."FGAC_REGION_CODE"=$2
  ORDER BY to_date(l."DATE_FROM", 'DD/MM/YYYY')`;
  const params = [formatId, regionCode];
  return dbQuery(query, params);
};

/**
 * Get returns lines
 * @param {Number} formatId - the ARTY_ID=
 * @param {Number} region code - FGAC_REGION_CODE
 * @param {String} dateFrom - e.g. YYYY-MM-DD
 * @param {String} dateTo - e.g. YYYY-MM-DD
 * @return {Promise} resolves with array of DB records
 */
const getLines = (formatId, regionCode, dateFrom, dateTo) => {
  const query = `SELECT l.*
  FROM "import"."NALD_RET_LINES" l
  WHERE l."ARFL_ARTY_ID"=$1 AND l."FGAC_REGION_CODE"=$2 AND
  to_date("RET_DATE", 'YYYYMMDDHH24MISS')>=to_date($3, 'YYYY-MM-DD') AND to_date("RET_DATE", 'YYYYMMDDHH24MISS')<=to_date($4, 'YYYY-MM-DD')
  ORDER BY "RET_DATE"`;
  const params = [formatId, regionCode, dateFrom, dateTo];
  return dbQuery(query, params);
};

/**
 * Gets all form logs relating to the specified period - can be partial
 * @param {Number} formatId - the ARTY_ID=
 * @param {Number} region code - FGAC_REGION_CODE
 * @param {String} dateFrom - e.g. YYYY-MM-DD
 * @param {String} dateTo - e.g. YYYY-MM-DD
 * @return {Promise} resolves with array of DB records
 */
const getLogsForPeriod = (formatId, regionCode, dateFrom, dateTo) => {
  const query = `SELECT l.*
  FROM "import"."NALD_RET_FORM_LOGS" l
  WHERE
    l."ARTY_ID"=$1
    AND l."FGAC_REGION_CODE"=$2
    AND to_date(l."DATE_TO", 'DD/MM/YYYY')>=to_date($3, 'YYYY-MM-DD')
    AND to_date(l."DATE_FROM", 'DD/MM/YYYY')<=to_date($4, 'YYYY-MM-DD')
  ORDER BY to_date(l."DATE_FROM", 'DD/MM/YYYY')`;
  const params = [formatId, regionCode, dateFrom, dateTo];
  return dbQuery(query, params);
};

/**
 * Get returns lines for log
 * @param {Number} formatId - the ARTY_ID=
 * @param {Number} region code - FGAC_REGION_CODE
 * @param {String} logDateFrom - e.g. DD/MM/YYYY
 * @return {Promise} resolves with array of DB records
 */
const getLogLines = (formatId, regionCode, logDateFrom) => {
  const from = moment(logDateFrom, 'DD/MM/YYYY').format('YYYYMMDD') + '000000';
  const query = `SELECT l.* FROM "import"."NALD_RET_LINES" l
  WHERE l."ARFL_ARTY_ID"=$1 AND l."FGAC_REGION_CODE"=$2 AND
  "ARFL_DATE_FROM"=$3
  ORDER BY "RET_DATE"`;
  const params = [formatId, regionCode, from];
  return dbQuery(query, params);
};

module.exports = {
  getFormats,
  getFormatPurposes,
  getFormatPoints,
  getLogs,
  getLines,
  getLogLines,
  getLogsForPeriod
};
