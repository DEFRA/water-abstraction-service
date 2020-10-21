'use strict';
const rp = require('request-promise-native').defaults({
  strictSSL: false
});
const config = require('../../../config');

/**
 * Search companies house companies with the supplied query string
 * @param {String} q - search query string
 * @param {Number} startIndex - the index of the item to return from in the result set
 * @param {Number} perPage - the number of results to retrieve per page
 * @return {Promise}
 */
const searchCompanies = (q, startIndex = 0, perPage = 20) => {
  const apiKeyBase64Encoded = Buffer.from(config.companiesHouse.apiKey).toString('base64');
  const options = {
    method: 'GET',
    uri: 'https://api.companieshouse.gov.uk/search/companies',
    qs: {
      q,
      start_index: startIndex,
      items_per_page: perPage
    },
    headers: {
      'Authorization': `Basic ${apiKeyBase64Encoded}`
    },
    json: true
  };

  return rp(options);
};

exports.searchCompanies = searchCompanies;
