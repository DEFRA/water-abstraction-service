'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const crmAddressConnector = require('../../../../src/lib/connectors/crm-v2/addresses');
const addressMapper = require('../../../../src/lib/mappers/address');

const addressService = require('../../../../src/modules/addresses/services/address-service');

const addressId = 'test-address-id';
const address = {
  address1: 'test-address-1',
  address2: 'test-address-2',
  address3: 'test-address-3',
  address4: 'test-address-4',
  town: 'test-town',
  county: 'test-county',
  country: 'test-country',
  postcode: 'test-postcode',
  isTest: true,
  dataSource: 'nald',
  uprn: 123456
};

experiment('modules/addresses/lib/helpers', () => {
  beforeEach(() => {
    sandbox.stub(crmAddressConnector, 'createAddress').resolves({ addressId, ...address });
    sandbox.stub(addressMapper, 'crmToModel');
  });

  afterEach(() => sandbox.restore());

  experiment('.create', () => {
    beforeEach(async () => {
      await addressService.create(address);
    });

    test('creates the new address', () => {
      expect(crmAddressConnector.createAddress.calledWith(
        address
      )).to.be.true();
    });

    test('maps the address', () => {
      expect(addressMapper.crmToModel.calledWith(
        { addressId, ...address }
      )).to.be.true();
    });
  });
});
