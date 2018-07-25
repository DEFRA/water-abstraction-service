/**
 * Code for loading imported data to the target database(s)
 */
const Permit = require('../../lib/connectors/permit');
const Documents = require('../../lib/connectors/crm/documents');
const Returns = require('../../lib/connectors/returns');

const { buildCRMPacket } = require('./transform-crm');
const { buildReturnsPacket } = require('./transform-returns');
const { getLicenceJson, buildPermitRepoPacket } = require('./transform-permit');
const { find } = require('lodash');
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
 * Prepares returns data
 * @param {Array} data - a list of objects for licences being imported
 * @return {Promise} resolves with returns data included in list
 */
const persistReturns = async (data) => {
  const returns = [];
  const versions = [];
  const lines = [];

  for (let row of data) {
    console.log(`Posting to returns for ${row.licenceNumber}`);
    try {
      const licenceReturns = await buildReturnsPacket(row.licenceNumber);
      // Persist
      await Returns.returns.create(licenceReturns.returns, ['return_id']);
      await Returns.versions.create(licenceReturns.versions, ['version_id']);
      await Returns.lines.create(licenceReturns.lines, ['line_id']);
    } catch (error) {
      row.error = error;
    }
  }

  return data;
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
  let list = await preparePermitRepoData(licenceNumbers);
  list = await persistPermits(list);
  list = await persistCrmDocuments(list);
  list = await persistReturns(list);
  await updateImportLog(list);
};

module.exports = {
  load
};
