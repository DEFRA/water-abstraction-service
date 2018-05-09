const LicenceTransformer = require('../../lib/licence-transformer');
const { licences } = require('../../lib/connectors/permit');

/**
 * Get a list of permit repo IDs for each licence from the contact list
 * (system_external_id in CRM is licence_id in permit repo)
 * @param {Array} contactList - an array of contacts following de-dupe
 * @return {Array} an array of licence numbers
 */
function getSystemInternalIds (contactList) {
  return contactList.reduce((acc, contact) => {
    return [...acc, ...contact.licences.map(row => row.system_internal_id)];
  }, []);
}

/**
 * @param {Array} licenceIds - permit repo licence IDS
 * @return {Object} transformed licence data, keyed by licence number
 */
async function loadLicenceData (licenceIds) {
  const filter = {
    licence_id: licenceIds
  };

  const { data, error } = await licences.findMany(filter);

  if (error) {
    throw error;
  }

  return data.reduce(async (acc, licence) => {
    const { licence_data_value: licenceData } = licence;
    const transformer = new LicenceTransformer();
    await transformer.load(licenceData);

    return {
      ...acc,
      [licence.licence_ref]: transformer.export()
    };
  }, {});
}

module.exports = (contacts) => {
  // Load licence data from permit repo, and use NALD licence transformer
  // to transform to same format used in front-end GUI
  const licenceIds = getSystemInternalIds(contacts);
  return loadLicenceData(licenceIds);
};
