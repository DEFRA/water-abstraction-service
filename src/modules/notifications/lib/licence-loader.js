const LicenceTransformer = require('../../../lib/licence-transformer');
const { licences } = require('../../../lib/connectors/permit');

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
 * Fetch all pages
 * @param {Object} filter - query filter for data
 * @param {Object} sort - sort fields, direction
 */
async function fetchAllPages (filter, sort = null, cb) {
  let data = [];
  let page = 1;
  const perPage = 100;
  let pageCount;
  do {
    const { data: dataPage, error, pagination } = await licences.findMany(filter, sort, { perPage, page });
    if (error) {
      throw error;
    }
    data.push(...dataPage);
    page++;
    pageCount = pagination.pageCount;
  } while (page <= pageCount);

  return data;
}

/**
 * @param {Array} licenceIds - permit repo licence IDS
 * @return {Object} transformed licence data, keyed by licence number
 */
async function loadLicenceData (licenceIds) {
  const filter = {
    licence_id: { $in: licenceIds }
  };

  // Fetch all pages of results
  const data = await fetchAllPages(filter, null, licences.findMany);

  let obj = {};

  for (let row of data) {
    let { licence_data_value: licenceData } = row;
    let transformer = new LicenceTransformer();
    await transformer.load(licenceData);
    obj[row.licence_ref] = transformer.export();
  };

  return obj;
}

module.exports = (contacts) => {
  // Load licence data from permit repo, and use NALD licence transformer
  // to transform to same format used in front-end GUI
  const licenceIds = getSystemInternalIds(contacts);
  return loadLicenceData(licenceIds);
};
