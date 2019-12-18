'use strict';

const rp = require('request-promise-native');
const config = require('../../../../config.js');
const urlJoin = require('url-join');

const getRequestOptions = (path, query) => ({
  uri: urlJoin(config.services.chargeModule, path),
  json: true,
  ...(query && { qs: query })
});

/**
 * Makes a GET request to the charging module API.
 *
 * The request path will be appended to the origin value taken from configuration.
 *
 * @param {String} path The path of the URL that the request will be made to.
 * @param {Object} query Optional query params to pass
 */
const get = (path, query) => rp.get(getRequestOptions(path, query));

exports.get = get;
