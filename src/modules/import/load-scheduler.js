/**
 * Creates events on the message queue to import each licence
 * these are prioritised so that registered licence are done first
 */
const { getRegisteredLicences } = require('../../lib/connectors/crm/documents');
const { clearImportLog, createImportLog } = require('./lib/import-log');

/**
 * Schedules imports of all licences by placing them on the "water"."pending_import" table
 * @param {String} command - can be '-' for all licences, '@' for registered, or CSV
 * @return {Array} array of job IDs in message queue
 */
const loadScheduler = async (command = '-') => {
  // Get registered licence numbers
  const registered = await getRegisteredLicences();
  const registeredLicenceNumbers = registered.map(row => row.system_external_id);

  await clearImportLog();

  if (command === '-') {
    return createImportLog(registeredLicenceNumbers);
  } else if (command === '@') {
    return createImportLog(registeredLicenceNumbers, true);
  } else {
    return createImportLog(command.split(','), true);
  }
};

module.exports = {
  loadScheduler
};
