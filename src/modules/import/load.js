/**
 * Code for loading imported data to the target database(s)
 */
const moment = require('moment');
const uuidV4 = require('uuid/v4');
const { get } = require('lodash');
const { buildCRMPacket } = require('./transform-crm');
const { buildReturnsPacket } = require('./transform-returns');
const { getLicenceJson, buildPermitRepoPacket } = require('./transform-permit');
const { setImportStatus } = require('./lib/import-log.js');
const { importTableExists } = require('./lib/nald-queries');
const { deleteInvalidCycles } = require('./lib/delete-invalid-cycles');

const repository = require('./repositories');

const addTimestamp = (data) => {
  const ts = moment().format('YYYY-MM-DD HH:mm:ss');
  return data.map(row => {
    return {
      ...row,
      created_at: ts
    };
  });
};

const load = async (licenceNumber) => {
  try {
    console.log(`Import: permit ${licenceNumber}`);

    if (!await importTableExists()) {
      console.log(`Import: skip ${licenceNumber} - import table does not exist`);
      return;
    }

    await setImportStatus(licenceNumber, 'Importing');

    // Create permit repo data and persist
    const licenceData = await getLicenceJson(licenceNumber);
    const permit = buildPermitRepoPacket(licenceNumber, 1, 8, licenceData);
    const { rows: [ { licence_id: permitRepoId } ] } = await repository.licence.persist(permit, ['licence_id']);

    // Create CRM data and persist
    console.log(`Import: document header for ${licenceNumber}`);
    const crmData = buildCRMPacket(licenceData, licenceNumber, permitRepoId);
    await repository.document.persist({document_id: uuidV4(), ...crmData});

    console.log(`Import: returns for ${licenceNumber}`);
    const currentVersionStart = get(licenceData, 'data.current_version.licence.EFF_ST_DATE');

    const { returns } = await buildReturnsPacket(licenceNumber, currentVersionStart);
    await repository.return.persist(addTimestamp(returns));

    // Clean up invalid cycles
    const returnIds = returns.map(row => row.return_id);
    await deleteInvalidCycles(licenceNumber, returnIds);

    await setImportStatus(licenceNumber, 'OK');
    console.log(`Import: complete for ${licenceNumber}`);
  } catch (error) {
    console.error(error);
    await setImportStatus(licenceNumber, error.toString());
  }
};

module.exports = {
  load
};
