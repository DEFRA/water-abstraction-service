'use strict'

/**
 * Searches addresses and returns in service model shape
 * @param {String} request.query.q - the query
 */
const getAddressSearch = async (request, h) => {
  const { q } = request.query
  return request.server.methods.getAddressesByPostcode(q)
}

exports.getAddressSearch = getAddressSearch
