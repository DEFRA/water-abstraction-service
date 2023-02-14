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
 * It updates the Got default options 'got-with-proxy' applies to include:
 *
 * - prefixUrl set to the CM API base URL
 *
 * We also add 2 hooks; beforeRequest() to handle applying the auth header and token and afterResponse() to handle
 * logging errors and force a token refresh on a 401 Unauthorized response.
 */
const instance = gotWithProxy.extend({
  prefixUrl: config.chargeModule.host,
  hooks: {
    beforeRequest: [beforeRequestHook],
    afterResponse: [afterResponseHook]
  }
})

module.exports = instance
module.exports._beforeRequestHook = beforeRequestHook
module.exports._afterResponseHook = afterResponseHook
