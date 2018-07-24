/**
 * Code for loading imported data to the target database(s)
 */
const Permit = require('../../lib/connectors/permit');
const Documents = require('../../lib/connectors/crm/documents');
const { buildCRMPacket } = require('./transform-crm');
const { getLicenceJson, buildPermitRepoPacket } = require('./transform-permit');
const { filter, find } = require('lodash');
const { updateImportLog } = require('./lib/import-log.js');

/**
 * Prepares a batch of permit repo data given a list of licence numbers
 * @param {Array} licenceNumbers - the licence numbers to import to the permit repo
 * @return {Promise} resolves with list of permits to import
 */
const preparePermitRepoData = async (licenceNumbers) => {
  const result = [];
  for (let licenceNumber of licenceNumbers) {
    console.log(`Import: ${licenceNumber}`);
    try {
      // Create licence JSON from import tables
      const licenceData = await getLicenceJson(licenceNumber);

      result.push({
        licenceNumber,
        licenceData,
        error: null

      });
    } catch (error) {
      result.push({
        licenceNumber,
        licenceData: null,
        error
      });
    }
  }
  return result;
};

/**
 * Persist a batch of licences where there are no errors from previous step
 * @param {Array} result set from preparePermitRepoData
 * @return {Array} result
 */
const persistPermits = async (data) => {
  const postData = data.filter(row => !row.error && row.licenceData).map(row => {
    return buildPermitRepoPacket(row.licenceNumber, 1, 8, row.licenceData);
  });

  if (postData.length < 1) {
    return data;
  }

  console.log(`Import: Posting to permit repo`);

  // Persist batch of permits to permit repo
  const { error, data: permitData } = await Permit.licences.create(postData, ['licence_id', 'licence_ref']);

  if (error) {
    throw error;
  }

  // Add permit repo licence IDs to result set
  return data.map(row => {
    const permitRow = find(permitData, { licence_ref: row.licenceNumber });

    return {
      ...row,
      licenceId: permitRow ? permitRow.licence_id : null
    };
  });
};

/**
 * Persists batch of CRM documents where there are no errors from previous step
 * @param {Array} data - result of previous step
 */
const persistCrmDocuments = async (data) => {
  const postData = data.filter(row => !row.error && row.licenceId).map(row => {
    return buildCRMPacket(row.licenceData, row.licenceNumber, row.licenceId);
  });

  if (postData.length < 1) {
    return data;
  }

  console.log(`Import: Posting to CRM`);

  // Persist batch of permits to CRM  permit repo
  const { error, data: crmData } = await Documents.create(postData, ['document_id', 'system_external_id']);

  if (error) {
    throw error;
  }

  // Add permit repo licence IDs to result set
  return data.map(row => {
    const crmRow = find(crmData, { system_external_id: row.licenceNumber });

    return {
      ...row,
      documentId: crmRow ? crmRow.document_id : null
    };
  });
};

const load = async (licenceNumbers) => {
  const permits = await preparePermitRepoData(licenceNumbers);
  const result = await persistPermits(permits);
  const finalResult = await persistCrmDocuments(result);

  await updateImportLog(finalResult);
};

module.exports = {
  load
};
