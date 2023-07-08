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
 * Creates an extended Got instance
 *
 * The Got default options are updated to include:
 *
 * - JSON response types (all the CM APIs have JSON responses)
 * - Resolve with the response body only - this helps make the API more compatible with request which was used
 *   previously
 * - how long to try before timing out the request
 * - what requests should be retried (more details inline)
 * - proxy settings to support running in AWS environments
 *
 */
const gotWithProxy = got.extend({
  responseType: 'json',
  resolveBodyOnly: true,
  timeout: {
    request: 10000
  },
  // Got has a built in retry mechanism. We have found though you have to be careful with what gets retried. Our
  // preference is to only retry in the event of a timeout on assumption the destination server might be busy but has
  // a chance to succeed when attempted again
  retry: {
    // We ensure that the only network errors Got retries are timeout errors
    errorCodes: ['ETIMEDOUT'],
    // By default, Got does not retry POST requests. As we only retry timeouts there is no risk in retrying POST
    // requests. So, we set methods to be Got's defaults plus 'PATCH' and 'POST'
    methods: ['GET', 'PATCH', 'POST', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'],
    // The only status code we want to retry is 401 Unauthorized. We do not believe there is value in retrying others
    statusCodes: [401]
  },
  mutableDefaults: true,
  hooks: {
    beforeRequest: [beforeRequestHook]
  }
})

module.exports = gotWithProxy
module.exports._beforeRequestHook = beforeRequestHook
