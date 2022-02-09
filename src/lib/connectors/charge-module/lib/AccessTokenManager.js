'use strict';

const moment = require('moment');
const gotWithProxy = require('./got-with-proxy');
const urlJoin = require('url-join');

const { logger } = require('../../../../logger');
const config = require('../../../../../config.js');

class AccessTokenManager {
  constructor () {
    this.accessToken = null;
    this.expiresAt = null;
  }

  /**
   * Fetches a new access token from the cognito API
   * @returns
   */
  async refreshAccessToken (refDate) {
    logger.info('getting cognito token');
    const uri = urlJoin(config.chargeModule.cognito.host, '/oauth2/token');
    const buff = Buffer.from(`${config.chargeModule.cognito.username}:${config.chargeModule.cognito.password}`);
    const options = {
      searchParams: {
        grant_type: 'client_credentials'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${buff.toString('base64')}`
      }
    };

    // Make got request
    const { access_token: accessToken, expires_in: expiresIn } = await gotWithProxy.post(uri, options);

    // Update this instance with the access token and expiry time
    this.accessToken = accessToken;
    this.expiresAt = moment(refDate).add(expiresIn, 'second');
    logger.info(`obtained cognito token expires at ${this.expiresAt.format()}`);

    return this.accessToken;
  }

  /**
   * Checks whether the current auth token
   * appears to be valid
   * @return {Boolean}
   */
  isTokenValid () {
    // Token missing
    if (!this.accessToken) {
      logger.info('No cognito token found');
      return false;
    }
    // Token expires
    if (moment().isSameOrAfter(this.expiresAt)) {
      logger.info('Cognito token expired');
      return false;
    }
    return true;
  }
}

module.exports = AccessTokenManager;
