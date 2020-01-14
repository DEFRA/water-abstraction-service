'use strict';

const rp = require('request-promise-native');
const config = require('../../../../config.js');
const urlJoin = require('url-join');

const getURI = path => urlJoin(config.services.chargeModule, path);

const getRequestOptions = (path, query) => ({
  uri: getURI(path),
  json: true,
  ...(query && { qs: query })
});

const getPostRequestOptions = (path, payload = {}) => ({
  uri: getURI(path),
  json: true,
  method: 'POST',
  body: payload
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

const post = (path, payload) => rp.post(getPostRequestOptions(path, payload));

exports.get = get;
exports.post = post;
