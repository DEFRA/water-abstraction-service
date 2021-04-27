'use strict';

const got = require('got');
const urlJoin = require('url-join');
const tunnel = require('tunnel');

const config = require('../../../../config.js');
const { logger } = require('../../../logger');

/**
 * Creates a got instance which is extended to include:
 *
 * - proxy settings to work on AWS environments
 * - JSON response types (all the CM APIs have JSON responses)
 * - to resolve with the response body only - this helps make the API
 *   more compatible with request which was used previously
 */
const gotWithProxy = got.extend({
  responseType: 'json',
  resolveBodyOnly: true,
  hooks: {
    beforeRequest: [
      options => {
        if (config.proxy) {
          options.agent = {
            https: tunnel.httpsOverHttp({
              proxy: {
                host: config.proxy
              }
            })
          };
        };
      }
    ]
  }
});

/**
 * Gets access token for CM requests
 * @returns {Promise<String>}
 */
const getAccessToken = async () => {
  logger.info('getting cognito token');
  const uri = urlJoin(config.chargeModule.cognito.host, '/oauth2/token');
  const buff = Buffer.from(config.chargeModule.cognito.username + ':' + config.chargeModule.cognito.password);
  const options = {
    searchParams: {
      grant_type: 'client_credentials'
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${buff.toString('base64')}`
    }
  };
  const { access_token: accessToken } = await gotWithProxy.post(uri, options);
  return accessToken;
};

/**
 * Creates a got instance which is further extended to include:
 *
 * - fetching of access token
 * - prefixUrl set to the CM API base URL
 */
const instance = gotWithProxy.extend({
  prefixUrl: config.chargeModule.host,
  hooks: {
    afterResponse: [
      async (response, retryWithMergedOptions) => {
        if (response.statusCode === 401) { // Unauthorized
          // Refresh the access token
          const accessToken = await getAccessToken();
          const updatedOptions = {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          };

          // Save for further requests
          instance.defaults.options = got.mergeOptions(instance.defaults.options, updatedOptions);

          // Make a new retry
          return retryWithMergedOptions(updatedOptions);
        }

        // No changes otherwise
        return response;
      }
    ]

  },
  mutableDefaults: true
});

exports.got = instance;
