'use strict'

const got = require('got')

const config = require('../../../../../config.js')
const { logger } = require('../../../../logger.js')

const gotWithProxy = require('./got-with-proxy')
const AccessTokenManager = require('./AccessTokenManager')

// Create instance of token manager
const accessTokenManager = new AccessTokenManager()

/**
 * This hook occurs before the request is made in the lifecycle.
 * It checks if the access token appears to be valid, and if not,
 * requests a new one.
 *
 * It then updates the default Authorization header for future
 * requests.
 *
 * @param {Object} options - got request options
 */
const beforeRequestHook = async () => {
  if (!accessTokenManager.isTokenValid()) {
    logger.info('Fetching a new Cognito token')
    // Save for further requests
    const accessToken = await accessTokenManager.refreshAccessToken()
    instance.defaults.options.headers.Authorization = `Bearer ${accessToken}`
  }
}

/**
 * This hook occurs after the request is made in the lifecycle.
 * It checks if the request failed with a 401 (unauthorized), and
 * if so, it fetches a new access token and retries the request.
 *
 * It also updates the default Authorization header for future
 * requests.
 *
 * @param {Object} options - got request options
 */
const afterResponseHook = async (response, retryWithMergedOptions) => {
  if (response.statusCode >= 400) {
    logger.error(`Charging Module API error: ${response.statusCode}`, response.body)
  }

  if (response.statusCode === 401) { // Unauthorized
    // Refresh the access token
    const accessToken = await accessTokenManager.refreshAccessToken()
    const updatedOptions = {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }

    // Save for further requests
    instance.defaults.options = got.mergeOptions(instance.defaults.options, updatedOptions)

    // Make a new retry
    return retryWithMergedOptions(updatedOptions)
  }

  // No changes otherwise
  return response
}

/**
 * Creates an extended Got instance
 *
 * The Got default options are updated to include:
 *
 * - prefixUrl set to the CM API base URL
 * - JSON response types (all the CM APIs have JSON responses)
 * - how long to try before timing out the request
 * - Resolve with the response body only - this helps make the API more compatible with request which was
 *   used previously
 *
 * We also add 2 hooks; beforeRequest() to handle applying the auth header and token and afterResponse() to handle
 * logging errors and force a token refresh on a 401 Unauthorized response.
 */
const instance = gotWithProxy.extend({
  prefixUrl: config.chargeModule.host,
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
    // requests. So, we set methods to be Got's defaults plus 'POST'
    methods: ['GET', 'POST', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'],
    // The only status code we want to retry is 401 Unauthorized. We do not believe there is value in retrying others
    statusCodes: [401]
  },
  hooks: {
    beforeRequest: [beforeRequestHook],
    afterResponse: [afterResponseHook]
  },
  mutableDefaults: true
})

module.exports = instance
module.exports._beforeRequestHook = beforeRequestHook
module.exports._afterResponseHook = afterResponseHook
