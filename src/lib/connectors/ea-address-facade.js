'use strict';

const { http } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');
const { set } = require('lodash');
const urlJoin = require('url-join');

/**
 * Get an options object for use with request-promise
 * decorated with the auth header
 * @param {Object} options
 * @return {import('lodash').Object}
 */
const eaAddressFacadeRequest = (tail, options = {}) => {
  const requestOptions = {
    method: 'GET',
    uri: urlJoin(config.eaAddressFacade.uri, tail),
    json: true,
    ...options
  };
  set(requestOptions, 'qs.key', 'client1');
  return http.request(requestOptions);
};

/**
 * Search companies house companies with the supplied query string
 * @param {String} q - search query string
 * @param {Number} startIndex - the index of the item to return from in the result set
 * @param {Number} perPage - the number of results to retrieve per page
 * @return {Promise}
 */
const matchAddresses = q => {
  return eaAddressFacadeRequest('/address-service/v1/addresses/match', {
    qs: {
      'query-string': q
    }
  });
};

exports.matchAddresses = matchAddresses;
