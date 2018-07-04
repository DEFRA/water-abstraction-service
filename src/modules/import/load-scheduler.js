/**
 * Creates events on the message queue to import each licence
 * these are prioritised so that registered licence are done first
 */
const { getRegisteredLicences } = require('../../lib/connectors/crm/documents');
const { LOW_PRIORITY, MEDIUM_PRIORITY, HIGH_PRIORITY } = require('../../lib/priorities');
const { resetImportLog } = require('./lib/import-log');
const { getImportLicences } = require('./lib/nald-queries');
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
const loadScheduler = async (messageQueue) => {
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
  loadScheduler
};
