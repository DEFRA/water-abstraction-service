const { pick } = require('lodash');
const Address = require('../../../lib/models/address');

/**
 * Maps address data from CRM to water service Address model
 * @param {Object} data - address data from CRM
 * @return {Address}
 */
const mapCRMAddressToModel = data => {
  const address = new Address();
  address.fromHash({
    id: data.addressId,
    addressLine1: data.address1,
    addressLine2: data.address2,
    addressLine3: data.address3,
    addressLine4: data.address4,
    ...pick(data, ['town', 'county', 'postcode', 'country'])
  });
  return address;
};

exports.mapCRMAddressToModel = mapCRMAddressToModel;
