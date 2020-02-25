/**
 * Sets/resets the current status of importing licences
 * in the water.pending_import table
 */
const { dbQuery } = require('./db');

const PENDING_JOB_STATUS = {
  pending: 0,
  processing: 2,
  complete: 1
};

/**
 * Clears the import log ready for a new batch
 * @return {Promise} resolves when done
 */
const clearImportLog = () => {
  const sql = 'delete from water.pending_import';
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

  let sql = 'INSERT INTO "water"."pending_import" (licence_ref, status, priority) (SELECT "LIC_NO", 0, ( CASE ';

  if (licenceNumbers.length) {
    sql += ` WHEN ("LIC_NO" IN (${placeholders})) THEN 10 `;
  }

  sql += ` WHEN ("REV_DATE"='null' AND "LAPSED_DATE"='null' AND ("EXPIRY_DATE"='null' OR to_date("EXPIRY_DATE", 'DD/MM/YYYY')> NOW())) THEN 5
           ELSE 0 END) AS import_priority
           FROM "import"."NALD_ABS_LICENCES" `;

  if (licenceNumbers.length && filter) {
    sql += ` WHERE "LIC_NO" IN (${placeholders})`;
  }

  sql += ')';

  return dbQuery(sql, licenceNumbers);
};

/**
 * Updates import status of licence number specified
 * @param {String} licenceNumber - the abstraction licence number
 * @param {Number} status - 0 means pending import, 1 means importing/imported
 * @return Promise
 */
const setImportStatus = async (licenceNumber, message = '', status = 1) => {
  const sql = `
    UPDATE water.pending_import
    SET status=$1, log=$2, date_updated = now()
    WHERE licence_ref=$3;
  `;

  await dbQuery(sql, [status, message, licenceNumber]);
};

/**
 * Gets the next licence to import
 * @param {Number} batchSize - the number to import per batch
 * @return {Object} - pending_import row, or null if all complete
 */
const getNextImportBatch = async (batchSize = 10) => {
  const sql = `
    with nextBatch as (
      select id
      from water.pending_import
      where status = ${PENDING_JOB_STATUS.pending}
      order by priority desc
      limit $1
      for update skip locked
    )
    update water.pending_import pi set
      status = ${PENDING_JOB_STATUS.processing},
      date_updated = now()
    from nextBatch
    where pi.id = nextBatch.id
    returning pi.*;
  `;
  const rows = await dbQuery(sql, [batchSize]);
  return rows;
};

exports.clearImportLog = clearImportLog;
exports.createImportLog = createImportLog;
exports.getNextImportBatch = getNextImportBatch;
exports.setImportStatus = setImportStatus;
