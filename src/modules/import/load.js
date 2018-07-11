/**
 * Code for loading imported data to the target database(s)
 */
const Permit = require('../../lib/connectors/permit');
const Documents = require('../../lib/connectors/crm/documents');
const { buildCRMPacket } = require('./transform-crm');
const { getLicenceJson, buildPermitRepoPacket } = require('./transform-permit');
const { updateImportLog } = require('./lib/import-log.js');

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

    const crmPacket = await buildCRMPacket(licenceData, licenceNumber, data.licence_id);
    const { error: crmError } = await Documents.create(crmPacket);
    if (crmError) {
      console.error(crmError);
      throw crmError;
    };
    await updateImportLog(licenceNumber, 'OK');
  } catch (error) {
    await updateImportLog(licenceNumber, error.toString());
    throw error;
  }
};

module.exports = {
  load
};
