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
 * Creates a got instance which is further extended to include:
 *
 * - fetching of access token
 * - prefixUrl set to the CM API base URL
 */
const instance = gotWithProxy.extend({
  prefixUrl: config.chargeModule.host,
  retries: 3,
  hooks: {
    beforeRequest: [beforeRequestHook],
    afterResponse: [afterResponseHook]
  },
  mutableDefaults: true
})

module.exports = instance
module.exports._beforeRequestHook = beforeRequestHook
module.exports._afterResponseHook = afterResponseHook
