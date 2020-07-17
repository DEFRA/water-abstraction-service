const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const addressMapper = require('../../../src/lib/mappers/address');
const Address = require('../../../src/lib/models/address');

const createCrmAddress = (index = 0) => ({
  addressId: `7d78cca3-4ed5-457d-a594-2b9687b7870${index}`,
  address1: `address1_${index}`,
  address2: `address2_${index}`,
  address3: `address3_${index}`,
  address4: `address4_${index}`,
  town: `town_${index}`,
  county: `county_${index}`,
  postcode: `country_${index}`,
  country: `country_${index}`,
  dataSource: 'nald',
  uprn: 12345
});

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
    let crmAddress, address;

    beforeEach(async () => {
      crmAddress = createCrmAddress();
      address = addressMapper.crmToModel(crmAddress);
    });

    test('address is mapped correctly', async () => {
      expect(address.id).to.equal(crmAddress.addressId);
      expect(address.addressLine1).to.equal(crmAddress.address1);
      expect(address.addressLine2).to.equal(crmAddress.address2);
      expect(address.addressLine3).to.equal(crmAddress.address3);
      expect(address.addressLine4).to.equal(crmAddress.address4);
      expect(address.town).to.equal(crmAddress.town);
      expect(address.county).to.equal(crmAddress.county);
      expect(address.postcode).to.equal(crmAddress.postcode);
      expect(address.country).to.equal(crmAddress.country);
      expect(address.source).to.equal(crmAddress.dataSource);
      expect(address.uprn).to.equal(crmAddress.uprn);
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
      expect(address.county).to.be.undefined();
      expect(address.country).to.equal(eaAddress.country);
      expect(address.source).to.equal('ea-address-facade');
    });
  });
});
