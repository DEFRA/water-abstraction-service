'use strict';

const { http } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');
const { set, cloneDeep } = require('lodash');

/**
 * Get an options object for use with request-promise
 * decorated with the auth header
 * @param {Object} options
 * @return {import('lodash').Object}
 */
const createOptionsWithAuthentication = (options = {}) => {
  const apiKeyBase64Encoded = Buffer.from(config.companiesHouse.apiKey).toString('base64');
  return set(cloneDeep(options), 'headers.Authorization', `Basic ${apiKeyBase64Encoded}`);
};

/**
 * Search companies house companies with the supplied query string
 * @param {String} q - search query string
 * @param {Number} startIndex - the index of the item to return from in the result set
 * @param {Number} perPage - the number of results to retrieve per page
 * @return {Promise}
 */
const searchCompanies = (q, startIndex = 0, perPage = 20) => {
  const options = createOptionsWithAuthentication({
    method: 'GET',
    uri: 'https://api.companieshouse.gov.uk/search/companies',
    qs: {
      q,
      start_index: startIndex,
      items_per_page: perPage
    },
    json: true
  });
  return http.request(options);
};

exports.searchCompanies = searchCompanies;
