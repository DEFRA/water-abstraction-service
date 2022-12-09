'use strict'

/**
 * Used by HapiPinoPlugin to determine which requests to log
 * @module HapiPinoIgnoreRequestService
 */

class HapiPinoIgnoreRequestService {
  /**
   * Returns true or false whether a request should be loged
   *
   * Used by `src/plugins/hapi_pino.plugin.js` to control what does and doesn't get added to our log output. `/status`
   * is to support the AWS load balancer health checks which fire approximately every 500ms. If we logged these
   * requests our log would be too noisy to prove useful.
   *
   * @param {Object} _options The options passed to the HapiPino plugin
   * @param {request} request Hapi request object created internally for each incoming request
   *
   * @returns {boolean} true if the request should be ignored, else false
   */
  static go (_options, request) {
    const staticPaths = ['/status', '/favicon.ico']

    // If request is a known path ignore it
    if (staticPaths.includes(request.path)) {
      return true
    }

    // Do not ignore all other requests
    return false
  }
}

module.exports = HapiPinoIgnoreRequestService
