/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-licences
 */
const { APIClient } = require('hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const logger = require('../../logger');

// Create API client
const client = new APIClient(rp, {
  endpoint: `${process.env.CRM_URI}/documentHeader`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Get all registered licences - i.e. ones with a company entity ID set
 * @return {Promise} resolves with array of CRM document headers
 */
client.getRegisteredLicences = async function () {
  const getRegisteredLicencePage = (page = 1) => {
    const filter = {
      company_entity_id: {
        $ne: null
      }
    };
    return client.findMany(filter, null, { page, perPage: 250 });
  };

  // Get first page of results
  let { error, data, pagination } = await getRegisteredLicencePage(1);

  if (error) {
    throw error;
  }

  for (let i = 2; i <= pagination.pageCount; i++) {
    let { data: nextPage, error: nextError } = await getRegisteredLicencePage(i);
    if (nextError) {
      throw nextError;
    }
    data.push(...nextPage);
  }

  return data;
};

/**
 * Get a list of licences based on the supplied options
 * @param {Object} filter - criteria to filter licence list
 * @param {String} [filter.entity_id] - the current user's entity ID
 * @param {String} [filter.email] - the email address to search on
 * @param {String} [filter.string] - the search query, can be licence number, user-defined name etc.
 * @param {Object} [sort] - fields to sort on
 * @param {Number} [sort.licenceNumber] - sort on licence number, +1 : asc, -1 : desc
 * @param {Number} [sort.name] - sort on licence name, +1 : asc, -1 : desc
 * @param {Object} [pagination] - pagination controls
 * @param {Number} [pagination.page] - the current page
 * @param {Number} [pagination.perPage] - per page
 * @return {Promise} resolves with array of licence records
 * @example getLicences({entity_id : 'guid'})
 */
client.getDocumentRoles = function (filter, sort = {}, pagination = { page: 1, perPage: 100 }) {
  const uri = process.env.CRM_URI + '/document_role_access?filter=' + JSON.stringify(filter);
  return rp({
    uri,
    method: 'GET',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    json: true,
    body: { filter, sort, pagination }
  });
};

/**
 * Get single licence
 * @param {String} [document_id] - the ID of the document to find
 * @return {Promise} resolves with single licence record
 */
client.getDocument = function (documentId) {
  const uri = process.env.CRM_URI + `/documentHeader/${documentId}`;
  logger.info(uri);
  return rp({
    uri,
    method: 'GET',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    json: true
  });
};

/**
 * Get a list of documents with contacts attached
 * @param {Object} filter
 * @return {Promise} reoslves with array of licence records with contact data
 */
client.getDocumentContacts = function (filter = {}) {
  return rp({
    uri: `${process.env.CRM_URI}/contacts`,
    method: 'GET',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    json: true,
    qs: { filter: JSON.stringify(filter) }
  });
};

module.exports = client;
