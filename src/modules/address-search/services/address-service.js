'use strict';

const { sortBy } = require('lodash');

const eaAddressFacadeApi = require('../../../lib/connectors/ea-address-facade');
const addressMapper = require('../../../lib/mappers/address');

/**
 * Searches addresses using EA address facade
 * Returns addresses mapped to service model format
 * @param {String} query
 * @return {Promise<Array>}
 */
const getAddresses = async query => {
  const data = await eaAddressFacadeApi.matchAddresses(query);

  const addresses = data.results.map(addressMapper.eaAddressFacadeToModel);

  return {
    data: sortBy(addresses, address => address.sortKey)
  };
};

exports.getAddresses = getAddresses;
