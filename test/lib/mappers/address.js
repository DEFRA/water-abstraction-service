'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Address = require('../../../src/lib/models/address');
const addressMapper = require('../../../src/lib/mappers/address');

const dbRow = {
  addressId: '00000000-0000-0000-0000-000000000000',
  address1: 'address 1',
  address2: 'address 2',
  address3: 'address 3',
  address4: 'address 4',
  town: 'town',
  county: 'county',
  postcode: 'AB12 3CD',
  country: 'country'
};

const addressData = {
  addressLine1: 'address 1',
  addressLine2: 'address 2',
  addressLine3: 'address 3',
  addressLine4: 'address 4',
  town: 'town',
  county: 'county',
  postcode: 'AB12 3CD',
  country: 'country'
};

experiment('modules/billing/mappers/address', () => {
  experiment('.crmToModel', () => {
    let result;

    beforeEach(async () => {
      result = addressMapper.crmToModel(dbRow);
    });

    test('returns null when data is empty', async () => {
      const result = addressMapper.crmToModel(null);
      expect(result).to.equal(null);
    });

    test('returns an Address instance', async () => {
      expect(result instanceof Address).to.be.true();
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.addressId);
    });

    test('has the expected address line 1 value', async () => {
      expect(result.addressLine1).to.equal(dbRow.address1);
    });

    test('has the expected address line 2 value', async () => {
      expect(result.addressLine2).to.equal(dbRow.address2);
    });

    test('has the expected address line 3 value', async () => {
      expect(result.addressLine3).to.equal(dbRow.address3);
    });

    test('has the expected address line 4 value', async () => {
      expect(result.addressLine4).to.equal(dbRow.address4);
    });

    test('has the expected town value', async () => {
      expect(result.town).to.equal(dbRow.town);
    });

    test('has the expected county value', async () => {
      expect(result.county).to.equal(dbRow.county);
    });

    test('has the expected postcode value', async () => {
      expect(result.postcode).to.equal(dbRow.postcode);
    });

    test('has the expected country value', async () => {
      expect(result.country).to.equal(dbRow.country);
    });
  });

  experiment('.serviceToCrm', () => {
    let result;

    beforeEach(async () => {
      result = addressMapper.serviceToCrm(addressData);
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(addressData.addressId);
    });

    test('has the expected address 1 value', async () => {
      expect(result.address1).to.equal(addressData.addressLine1);
    });

    test('has the expected address line 2 value', async () => {
      expect(result.address2).to.equal(addressData.addressLine2);
    });

    test('has the expected address line 3 value', async () => {
      expect(result.address3).to.equal(addressData.addressLine3);
    });

    test('has the expected address line 4 value', async () => {
      expect(result.address4).to.equal(addressData.addressLine4);
    });

    test('has the expected town value', async () => {
      expect(result.town).to.equal(addressData.town);
    });

    test('has the expected county value', async () => {
      expect(result.county).to.equal(addressData.county);
    });

    test('has the expected postcode value', async () => {
      expect(result.postcode).to.equal(addressData.postcode);
    });

    test('has the expected country value', async () => {
      expect(result.country).to.equal(addressData.country);
    });
  });
});
