'use strict';

const eaAddressFacadeApi = require('../../../lib/connectors/ea-address-facade');
const addressMapper = require('../../../lib/mappers/address');

/**
 * Searches addresses using EA address facade
 * Returns addresses mapped to service model format
 * @param {String} query
 * @return {Promise<Array>}
 */
const getAddresses = async query => {
  const data = await eaAddressFacadeApi.searchAddresses(query);

  return {
    data: data.results.map(addressMapper.eaAddressFacadeToModel)
  };
};

exports.getAddresses = getAddresses;
