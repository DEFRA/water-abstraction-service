'use strict'

const db = require('./db')

/**
 * Get returns lines
 * @param {Number} formatId - the ARTY_ID=
 * @param {Number} region code - FGAC_REGION_CODE
 * @param {String} dateFrom - e.g. YYYY-MM-DD
 * @param {String} dateTo - e.g. YYYY-MM-DD
 * @return {Promise} resolves with array of DB records
 */
const getLines = (formatId, regionCode, dateFrom, dateTo) => {
  const query = `
    SELECT l.*
    FROM "import"."NALD_RET_LINES" l
    WHERE l."ARFL_ARTY_ID"=$1
    AND l."FGAC_REGION_CODE"=$2
    AND to_date("RET_DATE", 'YYYYMMDDHH24MISS')>=to_date($3, 'YYYY-MM-DD')
    AND to_date("RET_DATE", 'YYYYMMDDHH24MISS')<=to_date($4, 'YYYY-MM-DD')
    ORDER BY "RET_DATE";
  `

  const params = [formatId, regionCode, dateFrom, dateTo]
  return db.dbQuery(query, params)
}

/**
 * Checks for nil return over the specified time period
 * @param {Number} formatId - the ARTY_ID=
 * @param {Number} region code - FGAC_REGION_CODE
 * @param {String} dateFrom - e.g. YYYY-MM-DD
 * @param {String} dateTo - e.g. YYYY-MM-DD
 * @return {Promise} resolves with boolean
 */
const isNilReturn = async (formatId, regionCode, dateFrom, dateTo) => {
  const query = `
    SELECT SUM(
      CASE
        WHEN l."RET_QTY"='' THEN 0
        ELSE l."RET_QTY"::float
      END
    ) AS total_qty
    FROM "import"."NALD_RET_LINES" l
    WHERE l."ARFL_ARTY_ID"=$1
    AND l."FGAC_REGION_CODE"=$2
    AND to_date("RET_DATE", 'YYYYMMDDHH24MISS')>=to_date($3, 'YYYY-MM-DD')
    AND to_date("RET_DATE", 'YYYYMMDDHH24MISS')<=to_date($4, 'YYYY-MM-DD');
  `

  const params = [formatId, regionCode, dateFrom, dateTo]
  const rows = await db.dbQuery(query, params)
  return rows[0].total_qty === 0
}

exports.getLines = getLines
exports.isNilReturn = isNilReturn
