/**
 * Sets/resets the current status of importing licences
 * in the water.pending_import table
 */
const { dbQuery } = require('./db');

/**
 * Clears the import log ready for a new batch
 * @return {Promise} resolves when done
 */
const clearImportLog = () => {
  const sql = `delete from water.pending_import`;
  return dbQuery(sql);
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

  return dbQuery(sql, licenceNumbers);
};

/**
 * Gets an appropriate status message given a row of import data
 * @param {Object} row
 * @return {String} log message
 */
const getMessage = (row) => {
  let msg = 'OK';
  if (row.error) {
    msg = row.error;
  } else if (!row.licenceData) {
    msg = 'Missing licence data';
  } else if (!row.licenceId) {
    msg = 'Missing permit repo ID';
  } else if (!row.documentId) {
    msg = 'Missing CRM document ID';
  }
  return msg;
};

/**
 * Updates the import log with done status and optional log message
 * @param {Array} batch of objects representing importing licences
 * @return {Promise} resolves when updated
 */
const updateImportLog = (data) => {
  const parts = [];
  const params = data.reduce((acc, row) => {
    parts.push(`($${acc.length + 1}, $${acc.length + 2})`);
    return [...acc, row.licenceNumber, getMessage(row)];
  }, []);

  const sql = `
    UPDATE water.pending_import AS t SET
        status=1, date_updated=NOW(), log = c.log
    FROM (VALUES
        ${parts.join(',')}
    ) AS c(licence_ref, log)
    WHERE c.licence_ref = t.licence_ref;
    `;

  return dbQuery(sql, params);
};

/**
 * Gets the next licence to import
 * @return {Object} - pending_import row, or null if all complete
 */
const getNextImport = async () => {
  const sql = `SELECT * FROM water.pending_import WHERE status=0 ORDER BY priority DESC LIMIT 1`;
  const rows = await dbQuery(sql);
  return rows.length ? rows[0] : null;
};

/**
 * Gets the next licence to import
 * @param {Number} batchSize - the number to import per batch
 * @return {Object} - pending_import row, or null if all complete
 */
const getNextImportBatch = async (batchSize = 10) => {
  const sql = `SELECT * FROM water.pending_import WHERE status=0 ORDER BY priority DESC LIMIT $1`;
  const rows = await dbQuery(sql, [batchSize]);
  return rows;
};

module.exports = {
  clearImportLog,
  createImportLog,
  updateImportLog,
  getNextImport,
  getNextImportBatch
};
