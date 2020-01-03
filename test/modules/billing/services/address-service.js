const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const addressService = require('../../../../src/modules/billing/services/address-service');

const createCrmAddress = (index = 0) => ({
  addressId: `7d78cca3-4ed5-457d-a594-2b9687b7870${index}`,
  address1: `address1_${index}`,
  address2: `address2_${index}`,
  address3: `address3_${index}`,
  address4: `address4_${index}`,
  town: `town_${index}`,
  county: `county_${index}`,
  postcode: `country_${index}`,
  country: `country_${index}`
});

experiment('modules/billing/services/address-service', () => {
  experiment('.mapCRMAddressToModel', () => {
    let crmAddress, address;

    beforeEach(async () => {
      crmAddress = createCrmAddress();
      address = addressService.mapCRMAddressToModel(crmAddress);
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
    });
  });
});
