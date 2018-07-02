/**
 * Creates events on the message queue to import each licence
 * these are prioritised so that registered licence are done first
 */

const { getRegisteredLicences } = require('../../lib/connectors/crm/documents');
const { pool } = require('../../lib/connectors/db');
const { LOW_PRIORITY, MEDIUM_PRIORITY, HIGH_PRIORITY } = require('../../lib/priorities');
const { resetImportLog } = require('./import-log.js');

/**
 * Gets a list of all the licences for import
 * @return {Promise} resolves with array of data from import table
 */
const getImportLicences = async () => {
  const sql = `SELECT "LIC_NO", "REV_DATE", "LAPSED_DATE" FROM "import"."NALD_ABS_LICENCES"`;
  const {error, rows} = await pool.query(sql);
  if (error) {
    throw error;
  }
  return rows;
};

/**
 * Gets the import priority
 * @param {Array} - array of registered licence numbers
 * @param {Object} - licenceRow - from import.NALD_ABS_LICENCES table
 * @return {Number} - import priority
 */
const getPriority = (registeredLicences, licenceRow) => {
  const { LIC_NO: licenceNumber, REV_DATE: revokedDate, LAPSED_DATE: lapsedDate } = licenceRow;
  if (registeredLicences.includes(licenceNumber)) {
    return HIGH_PRIORITY;
  }
  if (revokedDate !== 'null') {
    return LOW_PRIORITY;
  }
  if (lapsedDate !== 'null') {
    return LOW_PRIORITY;
  }
  return MEDIUM_PRIORITY;
};

/**
 * Schedules imports of all licences
 * @param {Object} messageQueue - PG Boss instance
 * @return {Array} array of job IDs in message queue
 */
const scheduleImports = async (messageQueue) => {
  // Get registered licence numbers
  const licences = await getRegisteredLicences();
  const licenceNumbers = licences.map(row => row.system_external_id);

  // Get all licences
  const importLicences = await getImportLicences();

  const licenceCount = importLicences.length;

  await resetImportLog();

  let index = 0;
  let jobIds = [];
  for (let row of importLicences) {
    const data = {
      licenceNumber: row.LIC_NO,
      licenceCount,
      index
    };
    const options = {
      priority: getPriority(licenceNumbers, row),
      singletonKey: row.LIC_NO,
      retryLimit: 3,
      expireIn: '24:00:00'
    };

    jobIds.push(await messageQueue.publish('import.licence', data, options));
    index++;
  }

  return jobIds;
};

module.exports = {
  scheduleImports
};
