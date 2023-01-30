'use strict'

const got = require('got')
const tunnel = require('tunnel')
const { URL } = require('url')

const config = require('../../../../../config.js')

const beforeRequestHook = options => {
  if (config.proxy) {
    const url = new URL(config.proxy)

    options.agent = {
      https: tunnel.httpsOverHttp({
        proxy: {
          host: url.hostname,
          port: parseInt(url.port)
        }
      })
    }
  }
}

/**
 * Creates a got instance which is extended to include:
 *
 * - proxy settings to work on AWS environments
 * - JSON response types (all the CM APIs have JSON responses)
 * - how long to try before timing out the request
 * - to resolve with the response body only - this helps make the API
 *   more compatible with request which was used previously
 */
const gotWithProxy = got.extend({
  responseType: 'json',
  resolveBodyOnly: true,
  timeout: {
    request: 5000
  },
  hooks: {
    beforeRequest: [beforeRequestHook]
  }
})

module.exports = gotWithProxy
module.exports._beforeRequestHook = beforeRequestHook
