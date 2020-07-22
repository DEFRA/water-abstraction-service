'use strict';

const { pick, isEmpty, omit } = require('lodash');
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
    addressLine1: data.address1 || null,
    addressLine2: data.address2 || null,
    addressLine3: data.address3 || null,
    addressLine4: data.address4 || null,
    ...pick(data, ['town', 'county', 'postcode', 'country'])
  });
  return address;
};

/**
 * Maps address data from ui to water service Address model
 * @param {Object} addressData
 * @return {Address}
 */
const uiToModel = addressData => {
  if (addressData.addressId) {
    return new Address(addressData.addressId);
  }
  const address = new Address();
  return address.fromHash(addressData);
};

/**
 * Maps data from Address model to expected crm shape
 * @param {Address} address service model
 * @return {Object}
 */
const modelToCrm = address => {
  const data = address.toJSON();
  return {
    address1: data.addressLine1,
    address2: data.addressLine2,
    address3: data.addressLine3,
    address4: data.addressLine4,
    ...omit(data, 'addressLine1', 'addressLine2', 'addressLine3', 'addressLine4')
  };
};

exports.crmToModel = crmToModel;
exports.uiToModel = uiToModel;
exports.modelToCrm = modelToCrm;
