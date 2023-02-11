'use strict'

const config = require('../../../../../config.js')
const { logger } = require('../../../../logger.js')

const gotWithProxy = require('./got-with-proxy')
const AccessTokenManager = require('./AccessTokenManager')

// Create instance of token manager
const accessTokenManager = new AccessTokenManager()

/**
 * Apply the Charging Module 'authorization' header to the request
 *
 * This hook occurs before the request is made in the lifecycle. It uses our `AccessTokenManager` instance to get the
 * AWS Cognito JWT needed to authenticate with the Charging Module and then uses it to update the Got options
 * with an 'authorization' header.
 *
 * @param {Object} options The current got request options
 */
const beforeRequestHook = async (options) => {
  const token = await accessTokenManager.token()

  options.headers = {
    authorization: `Bearer ${token}`
  }
}

/**
 * Log errors with responses and retry those failed because of 401 (unauthorized)
 *
 * This hook occurs after the request is made in the lifecycle. Any response with a status code of 400 or greater is
 * logged as an error.
 *
 * In the case of a 401 (unauthorized), it forces a refresh of the Charging Module Auth token and tries again
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
    // Force a refresh of access token
    const token = await accessTokenManager.token(true)
    const updatedOptions = {
      headers: {
        authorization: `Bearer ${token}`
      }
    }

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
