/**
 * Code for loading imported data to the target database(s)
 */
const Permit = require('../../lib/connectors/permit');
const Documents = require('../../lib/connectors/crm/documents');
const { buildCRMPacket } = require('./transform-crm');
const { buildReturnsPacket } = require('./transform-returns');
const { getLicenceJson, buildPermitRepoPacket } = require('./transform-permit');
const { updateImportLog } = require('./lib/import-log.js');
const { returns, versions, lines } = require('../../lib/connectors/returns');

/**
 * Persist data from returns packet to 3x returns endpoints
 * @param {Object} returnsPacket - created with buildReturnsPacket
 * @return {Promise} resolves when complete
 */
const persistReturnsPacket = async (returnsPacket) => {
  for (let row of returnsPacket.returns) {
    const { error } = await returns.create(row);
    if (error) {
      throw new Error(error);
    }
  }

  for (let row of returnsPacket.versions) {
    const { error: versionError } = await versions.create(row);
    if (versionError) {
      console.error(versionError);
      throw new Error(versionError);
    }
  }

  for (let row of returnsPacket.lines) {
    const { error: lineError } = await lines.create(row);
    if (lineError) {
      throw new Error(lineError);
    }
  }
};

/**
  * Persists licence to permit repo and CRM
  * @param {Object} requestBody - the request body to send to permit repo
  * @return {Promise}
  */
const load = async (licenceNumber) => {
  try {
    // Create licence JSON from import tables
    const licenceData = await getLicenceJson(licenceNumber);

    // Build and post data to permit repo
    const permitRepoPacket = buildPermitRepoPacket(licenceNumber, 1, 8, licenceData);

    const { data, error } = await Permit.licences.create(permitRepoPacket);
    if (error) {
      console.error(error);
      throw error;
    }

    // Build CRM data
    const crmPacket = await buildCRMPacket(licenceData, licenceNumber, data.licence_id);
    const { error: crmError } = await Documents.create(crmPacket);
    if (crmError) {
      console.error(crmError);
      throw crmError;
    };

    // Build returns data
    const returnsPacket = await buildReturnsPacket(licenceNumber);
    persistReturnsPacket(returnsPacket);

    await updateImportLog(licenceNumber, 'OK');
  } catch (error) {
    await updateImportLog(licenceNumber, error.toString());
    throw error;
  }
};

module.exports = {
  load
};
