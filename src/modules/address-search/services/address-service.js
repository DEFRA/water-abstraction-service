'use strict'

const { sortBy } = require('lodash')

const eaAddressFacadeApi = require('../../../lib/connectors/ea-address-facade')
const addressMapper = require('../../../lib/mappers/address')

/**
 * Searches addresses using EA address facade
 * Returns addresses mapped to service model format
 * @param {String} query
 * @return {Promise<Array>}
 */
const getAddressesByPostcode = async postcode => {
  const data = await eaAddressFacadeApi.getAddressesByPostcode(postcode)

  const addresses = data.results.map(addressMapper.eaAddressFacadeToModel)

  return {
    data: sortBy(addresses, address => address.sortKey)
  }
}

exports.getAddressesByPostcode = getAddressesByPostcode
