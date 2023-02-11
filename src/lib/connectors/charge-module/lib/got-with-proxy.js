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
 * - proxy settings to work on AWS environments
 */
const gotWithProxy = got.extend({
  hooks: {
    beforeRequest: [beforeRequestHook]
  }
})

module.exports = gotWithProxy
module.exports._beforeRequestHook = beforeRequestHook
