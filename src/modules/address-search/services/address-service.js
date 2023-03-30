'use strict'

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

  const sortedAddresses = addresses.sort((address1, address2) => {
    if (address1.sortKey < address2.sortKey) {
      return -1
    }
    if (address1.sortKey > address2.sortKey) {
      return 1
    }

    return 0
  })

  return {
    data: sortedAddresses
  }
}

exports.getAddressesByPostcode = getAddressesByPostcode
