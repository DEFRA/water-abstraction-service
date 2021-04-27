'use strict';

const got = require('got');
const tunnel = require('tunnel');

const config = require('../../../../../config.js');

const beforeRequestHook = options => {
  if (config.proxy) {
    options.agent = {
      https: tunnel.httpsOverHttp({
        proxy: {
          host: config.proxy
        }
      })
    };
  };
};

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
    beforeRequest: [beforeRequestHook]
  }
});

module.exports = gotWithProxy;
module.exports._beforeRequestHook = beforeRequestHook;
