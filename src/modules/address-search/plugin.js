'use strict'

/**
 * @module hapi plugin to wrap address search service request in server method
 *         caching avoids API rate limit being exceeded on subsequent identical requests
 */

const addressService = require('./services/address-service')

const config = {
  cache: {
    expiresIn: 6 * 60 * 60 * 1000,
    generateTimeout: 2000
  }
}

module.exports = {
  name: 'addressSearchPlugin',
  register: async server => {
    server.method('getAddressesByPostcode', addressService.getAddressesByPostcode, config)
  }
}
