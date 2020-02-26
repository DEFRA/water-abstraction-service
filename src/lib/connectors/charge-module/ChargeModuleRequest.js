'use strict';

const { http } = require('@envage/water-abstraction-helpers');
const urlJoin = require('url-join');
const moment = require('moment');
const { set, cloneDeep } = require('lodash');
const config = require('../../../../config.js');
const { logger } = require('../../../logger');

/**
 * Makes a request to the cognito server to obtain an auth token
 * @param {String} username
 * @param {String} password
 * @return {Promise<Object>}
 */
const makeTokenRequest = async () => {
  logger.info('getting cognito token');
  const buff = Buffer.from(config.cognito.username + ':' + config.cognito.password);
  const options = {
    method: 'POST',
    json: true,
    proxy: config.proxy || null,
    uri: urlJoin(config.services.cognito, '/oauth2/token'),
    qs: {
      grant_type: 'client_credentials'
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${buff.toString('base64')}`
    }
  };
  try {
    const response = await http.request(options);
    return response;
  } catch (err) {
    logger.error('error getting cognito token', err);
    throw err;
  }
};

class ChargeModuleRequest {
  constructor () {
    this.token = null;
    this.expires = null;
  }

  /**
   * Gets a new auth token and stores it in this object
   */
  async _getToken () {
    const result = await makeTokenRequest();
    this.token = result.access_token;
    this.expires = moment().add(result.expires_in, 'second');
    logger.info(`obtained cognito token expires at ${this.expires.format()}`);
  }

  /**
   * Checks whether the current auth token
   * appears to be valid
   * @return {Boolean}
   */
  _isTokenValid () {
    // Token missing
    if (!this.token) {
      logger.info('no cognito token');
      return false;
    }
    // Token expires
    if (moment().isSameOrAfter(this.expires)) {
      logger.info('cognito token expired');
      return false;
    }
    logger.info('use existing cognito token');
    return true;
  }

  /**
   * Gets a new auth token if needed
   * @return {Boolean}
   */
  async _refreshToken () {
    if (!this._isTokenValid()) {
      await this._getToken();
    }
  }

  /**
   * Returns request options with auth header added
   * @param {Object} options
   * @param {String} method - HTTP method
   * @return {Object}
   */
  _decorateRequestOptions (options) {
    const opts = cloneDeep(options); ;
    set(opts, 'headers.Authorization', `Bearer ${this.token}`);
    opts.proxy = config.proxy || null;
    return opts;
  }

  /**
   * Clears the current auth token
   */
  _clearToken () {
    this.token = null;
    this.expires = null;
  }

  /**
   * Make an HTTP request with the cognito auth token
   * @param {Object} options - request options
   * @param {Number} retryCount
   */
  async request (options, retryCount = 0) {
    await this._refreshToken();
    try {
      const response = await http.request(this._decorateRequestOptions(options));
      return response;
    } catch (err) {
      if (err.statusCode === 401 && retryCount < 3) {
        logger.info(`invalid/expired token attempt ${retryCount}`);
        this._clearToken();
        return this.request(options, retryCount + 1);
      }
      logger.error('charge module request error', err, { retryCount });
      throw err;
    }
  }

  /**
   * Make GET request
   * @param {Object} options
   * @return {Promise<Object>}
   */
  get (options) {
    return this.request({ ...options, method: 'GET' });
  }

  /**
   * Make POST request
   * @param {Object} options
   * @return {Promise<Object>}
   */
  post (options) {
    return this.request({ ...options, method: 'POST' });
  }

  patch (options) {
    return this.request({ ...options, method: 'PATCH' });
  }
}

module.exports = ChargeModuleRequest;
