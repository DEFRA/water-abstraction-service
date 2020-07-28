'use strict';

const { pick, isEmpty } = require('lodash');
const Address = require('../models/address');

/**
 * Maps address data from CRM to water service Address model
 * @param {Object} data - address data from CRM
 * @return {Address}
 */
const crmToModel = data => {
  if (isEmpty(data)) {
    return null;
  }
  const address = new Address();
  address.fromHash({
    id: data.addressId,
    addressLine1: data.address1,
    addressLine2: data.address2,
    addressLine3: data.address3,
    addressLine4: data.address4,
    ...pick(data, ['town', 'county', 'postcode', 'country', 'uprn']),
    source: data.dataSource || 'nald'
  });
  return address;
};

/**
 * Maps an address record from the EA address facade to a service model
 * @param {Object} data - EA address facade address
 * @return {Address}
 */
const eaAddressFacadeToModel = data => {
  const address = new Address();
  return address.fromHash({
    uprn: data.uprn,
    addressLine1: data.organisation,
    addressLine2: data.premises,
    addressLine3: data.street_address,
    addressLine4: data.locality,
    town: data.city,
    postcode: data.postcode,
    country: data.country,
    source: Address.ADDRESS_SOURCE.eaAddressFacade
  });
};

exports.crmToModel = crmToModel;
exports.eaAddressFacadeToModel = eaAddressFacadeToModel;
