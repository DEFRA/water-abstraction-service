'use strict';

const { omit } = require('lodash');
const Address = require('../models/address');

const { createMapper } = require('../object-mapper');
const { createModel } = require('./lib/helpers');

/**
 * Maps address data from CRM to water service Address model
 * @param {Object} data - address data from CRM
 * @return {Address}
 */
const crmToModelMapper = createMapper()
  .copy(
    'town',
    'county',
    'postcode',
    'country',
    'uprn'
  )
  .map('addressId').to('id')
  .map('address1').to('addressLine1')
  .map('address2').to('addressLine2')
  .map('address3').to('addressLine3')
  .map('address4').to('addressLine4')
  .map('dataSource').to('source', dataSource => dataSource || 'nald');

const crmToModel = row => createModel(Address, row, crmToModelMapper);

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

const pojoToModelMapper = createMapper()
  .copy(
    'id',
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'addressLine4',
    'town',
    'county',
    'postcode',
    'country',
    'uprn',
    'source'
  );

/**
 * Converts a plain object representation of a Address to a Address model
 * @param {Object} pojo
 * @return Address
 */
const pojoToModel = pojo => createModel(Address, pojo, pojoToModelMapper);

exports.crmToModel = crmToModel;
exports.uiToModel = uiToModel;
exports.modelToCrm = modelToCrm;
exports.eaAddressFacadeToModel = eaAddressFacadeToModel;
exports.pojoToModel = pojoToModel;
