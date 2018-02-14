/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-licences
 */
const { APIClient } = require('hapi-pg-rest-api');
const moment = require('moment');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

// Create API client
const client = new APIClient(rp, {
  endpoint: `${process.env.CRM_URI}/documentHeader`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Get a list of licences based on the supplied options
 * @param {Object} filter - criteria to filter licence lisrt
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
client.getDocumentRoles = function (filter, sort = {}, pagination = {page: 1, perPage: 100}) {
  console.log(filter)
  const uri = process.env.CRM_URI + '/document_role_access?filter='+JSON.stringify(filter);
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



module.exports = client;
