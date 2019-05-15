/**
 * Code for loading imported data to the target database(s)
 */
const uuidV4 = require('uuid/v4');
const { buildCRMPacket } = require('./transform-crm');
const { buildReturnsPacket } = require('./transform-returns');
const { getLicenceJson, buildPermitRepoPacket } = require('./transform-permit');
const { setImportStatus } = require('./lib/import-log.js');
const { importTableExists } = require('./lib/nald-queries');
const { voidInvalidCycles } = require('./lib/void-invalid-cycles');
const { persistReturns } = require('./lib/persist-returns');

const repository = require('./repositories');
const { logger } = require('@envage/water-abstraction-helpers');

/**
 * Loads data into the permit repository and CRM doc header
 * @param {String} licenceNumber
 * @param {Object} licenceData - extracted from NALD import tables
 * @return {Promise} resolves when completed
 */
const loadPermitAndDocumentHeader = async (licenceNumber, licenceData) => {
  logger.info(`Import: permit for ${licenceNumber}`);
  const permit = buildPermitRepoPacket(licenceNumber, 1, 8, licenceData);
  const { rows: [ { licence_id: permitRepoId } ] } = await repository.licence.persist(permit, ['licence_id']);

  // Create CRM data and persist
  logger.info(`Import: document header for ${licenceNumber}`);
  const crmData = buildCRMPacket(licenceData, licenceNumber, permitRepoId);
  await repository.document.persist({ document_id: uuidV4(), ...crmData });
};

/**
 * Calculates and imports a list of return cycles for the given licence
 * based on NALD formats and form logs
 * @param {String} licenceNumber
 * @param {Object} licenceData - extracted from NALD import tables
 * @return {Promise} resolves when returns imported
 */
const loadReturns = async (licenceNumber) => {
  logger.info(`Import: returns for ${licenceNumber}`);

  const { returns } = await buildReturnsPacket(licenceNumber);
  await persistReturns(returns);

  // Clean up invalid cycles
  const returnIds = returns.map(row => row.return_id);
  await voidInvalidCycles(licenceNumber, returnIds);
};

/**
 * Imports the whole licence
 * @param {String} licenceNumber
 * @return {Promise} resolves when complete
 */
const load = async (licenceNumber) => {
  try {
    logger.info(`Import: permit ${licenceNumber}`);

    if (!await importTableExists()) {
      logger.info(`Import: skip ${licenceNumber} - import table does not exist`);
      return;
    }

    await setImportStatus(licenceNumber, 'Importing');

    // Create permit repo data and persist
    const licenceData = await getLicenceJson(licenceNumber);

    await Promise.all([
      loadPermitAndDocumentHeader(licenceNumber, licenceData),
      loadReturns(licenceNumber)
    ]);

    await setImportStatus(licenceNumber, 'OK');
    logger.info(`Import: complete for ${licenceNumber}`);
  } catch (error) {
    logger.error(`Import failure`, error, { licenceNumber });
    await setImportStatus(licenceNumber, error.toString());
  }
};

module.exports = {
  load
};
