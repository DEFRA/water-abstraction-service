'use strict'

const addressService = require('./services/address-service')

/**
 * Searches addresses and returns in service model shape
 * @param {String} request.query.q - the query
 */
const getAddressSearch = async (request, h) => {
  const { q } = request.query
  return addressService.getAddressesByPostcode(q)
}

exports.getAddressSearch = getAddressSearch
