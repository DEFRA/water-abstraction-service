/**
 * Sets/resets the current status of importing licences
 * in the water.pending_import table
 */
const { pool } = require('../../../lib/connectors/db');

/**
 * Clears the import log ready for a new batch
 * @return {Promise} resolves when done
 */
const clearImportLog = () => {
  const sql = `delete from water.pending_import`;
  return pool.query(sql);
};

/**
 * Inserts into "water"."pending_import" a list of all licences to import
 * @param {Array} licenceNumbers - an optional array of registered licence numbers used in filtering/prioritisation
 * @param {Boolean} filter - if true, filters the list by registered licences only
 * @return {Promise} resolves when inserted
 */
const createImportLog = async (licenceNumbers = [], filter = false) => {
  const placeholders = licenceNumbers.map((value, i) => `$${i + 1}`);

  let sql = `INSERT INTO "water"."pending_import" (licence_ref, status, priority) (SELECT "LIC_NO", 0, ( CASE `;

  if (licenceNumbers.length) {
    sql += ` WHEN ("LIC_NO" IN (${placeholders})) THEN 10 `;
  }

  sql += ` WHEN ("REV_DATE"='null' AND "LAPSED_DATE"='null' AND ("EXPIRY_DATE"='null' OR to_date("EXPIRY_DATE", 'DD/MM/YYYY')> NOW())) THEN 5
           ELSE 0 END) AS import_priority
           FROM "import"."NALD_ABS_LICENCES" `;

  if (licenceNumbers.length && filter) {
    sql += ` WHERE "LIC_NO" IN (${placeholders})`;
  }

  sql += `)`;

  return pool.query(sql, licenceNumbers);
};

/**
 * Updates the import log with done status and optional log message
 * @param {String} licenceNumber
 * @param {String} log - optional log/error message
 * @return {Promise} resolves when updated
 */
const updateImportLog = (licenceNumber, log = null) => {
  const sql = `UPDATE water.pending_import
    SET status=1, date_updated=NOW(), log=$1
    WHERE licence_ref=$2`;
  return pool.query(sql, [log, licenceNumber]);
};

/**
 * Gets the next licence to import
 * @return {Object} - pending_import row, or null if all complete
 */
const getNextImport = async () => {
  const sql = `SELECT * FROM water.pending_import WHERE status=0 ORDER BY priority DESC LIMIT 1`;
  const { error, rows } = await pool.query(sql);
  if (error) {
    throw error;
  }
  return rows.length ? rows[0] : null;
};

module.exports = {
  clearImportLog,
  createImportLog,
  updateImportLog,
  getNextImport
};
