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
  country: 'country',
  isTest: false,
  uprn: 123456
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

const createEAAddressFacadeAddress = () => ({
  uprn: 12345,
  organisation: 'Big Co',
  premises: 'Big farm',
  street_address: 'Windy road',
  locality: 'Hilly place',
  city: 'Testington',
  postcode: 'TT1 1TT',
  country: 'United Kingdom'
});

experiment('modules/billing/mappers/address', () => {
  experiment('.crmToModel', () => {
    let result;

    beforeEach(async () => {
      result = addressMapper.crmToModel(dbRow);
    });

    test('returns empty Address instance when data is null', async () => {
      const result = addressMapper.crmToModel(null);
      expect(result instanceof Address).to.be.true();
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

    test('has the expected isTest value', async () => {
      expect(result.isTest).to.equal(dbRow.isTest);
    });

    test('has the expected uprn value', async () => {
      expect(result.uprn).to.equal(dbRow.uprn);
    });
  });

  experiment('.uiToModel', () => {
    let result;

    beforeEach(async () => {
      result = addressMapper.uiToModel(addressData);
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(addressData.addressId);
    });

    test('has the expected address line 1 value', async () => {
      expect(result.addressLine1).to.equal(addressData.addressLine1);
    });

    test('has the expected address line 2 value', async () => {
      expect(result.addressLine2).to.equal(addressData.addressLine2);
    });

    test('has the expected address line 3 value', async () => {
      expect(result.addressLine3).to.equal(addressData.addressLine3);
    });

    test('has the expected address line 4 value', async () => {
      expect(result.addressLine4).to.equal(addressData.addressLine4);
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

  experiment('.modelToCrm', () => {
    let result, address;

    beforeEach(async () => {
      address = new Address();
      address.fromHash(addressData);
      result = addressMapper.modelToCrm(address);
    });

    test('has the expected address 1 value', async () => {
      expect(result.address1).to.equal(address.addressLine1);
    });

    test('has the expected address line 2 value', async () => {
      expect(result.address2).to.equal(address.addressLine2);
    });

    test('has the expected address line 3 value', async () => {
      expect(result.address3).to.equal(address.addressLine3);
    });

    test('has the expected address line 4 value', async () => {
      expect(result.address4).to.equal(address.addressLine4);
    });

    test('does not contain "addressLines"', () => {
      expect(result.addressLine1).to.be.undefined();
      expect(result.addressLine2).to.be.undefined();
      expect(result.addressLine3).to.be.undefined();
      expect(result.addressLine4).to.be.undefined();
    });

    test('passes other data as is', async () => {
      expect(result.town).to.equal(address.town);
      expect(result.county).to.equal(address.county);
      expect(result.postcode).to.equal(address.postcode);
      expect(result.country).to.equal(address.country);
    });
  });

  experiment('.eaAddressFacadeToModel', () => {
    let eaAddress, address;

    beforeEach(async () => {
      eaAddress = createEAAddressFacadeAddress();
      address = addressMapper.eaAddressFacadeToModel(eaAddress);
    });

    test('address is mapped correctly', async () => {
      expect(address instanceof Address).to.be.true();
      expect(address.id).to.be.undefined();
      expect(address.addressLine1).to.equal(eaAddress.organisation);
      expect(address.addressLine2).to.equal(eaAddress.premises);
      expect(address.addressLine3).to.equal(eaAddress.street_address);
      expect(address.addressLine4).to.equal(eaAddress.locality);
      expect(address.town).to.equal(eaAddress.city);
      expect(address.county).to.be.null();
      expect(address.country).to.equal(eaAddress.country);
      expect(address.source).to.equal('ea-address-facade');
    });
  });

  experiment('.pojoToModel', () => {
    let result;

    beforeEach(async () => {
      result = addressMapper.pojoToModel({
        id: '00000000-0000-0000-0000-000000000000',
        ...addressData
      });
    });

    test('returns an Address instance', async () => {
      expect(result instanceof Address).to.be.true();
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal('00000000-0000-0000-0000-000000000000');
    });

    test('has the expected address line 1 value', async () => {
      expect(result.addressLine1).to.equal(addressData.addressLine1);
    });

    test('has the expected address line 2 value', async () => {
      expect(result.addressLine2).to.equal(addressData.addressLine2);
    });

    test('has the expected address line 3 value', async () => {
      expect(result.addressLine3).to.equal(addressData.addressLine3);
    });

    test('has the expected address line 4 value', async () => {
      expect(result.addressLine4).to.equal(addressData.addressLine4);
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
