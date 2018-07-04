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
 * Resets the import log by clearing and then selecing licence numbers
 * for import from current import table
 * @return {Promise} resolves when done
 */
const resetImportLog = async () => {
  await clearImportLog();
  const sql = `insert into water.pending_import (licence_ref,status)
      select "LIC_NO",0 from import."NALD_ABS_LICENCES";`;
  return pool.query(sql);
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

module.exports = {
  clearImportLog,
  resetImportLog,
  updateImportLog
};
