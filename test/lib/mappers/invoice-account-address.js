'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const { omit } = require('lodash');

const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');
const Address = require('../../../src/lib/models/address');
const Company = require('../../../src/lib/models/company');
const DateRange = require('../../../src/lib/models/date-range');
const Contact = require('../../../src/lib/models/contact-v2');

const invoiceAccountAddressMapper = require('../../../src/lib/mappers/invoice-account-address');

const dbRow = {
  invoiceAccountAddressId: '00000000-0000-0000-0000-000000000000',
  invoiceAccountId: '11111111-0000-0000-0000-000000000000',
  startDate: '2020-04-01',
  endDate: null,
  address: {
    addressId: '11111111-1111-1111-1111-111111111111',
    address1: 'First Floor',
    address2: 'Test HQ',
    address3: '123',
    address4: 'Test Street',
    postcode: 'TT1 1TT',
    country: 'UK'
  }
};

const pojo = {
  id: '00000000-0000-0000-0000-000000000000',
  invoiceAccountId: '11111111-0000-0000-0000-000000000000',
  dateRange: {
    startDate: '2020-04-01',
    endDate: null
  },
  address: {
    addressId: '11111111-1111-1111-1111-111111111111',
    addressLine1: 'First Floor',
    addressLine2: 'Test HQ',
    addressLine3: '123',
    addressLine4: 'Test Street',
    postcode: 'TT1 1TT',
    country: 'UK'
  }
};

experiment('modules/billing/mappers/invoice-account-address', () => {
  experiment('.crmToModel', () => {
    let result;

    beforeEach(async () => {
      result = invoiceAccountAddressMapper.crmToModel(dbRow);
    });

    test('returns an InvoiceAccountAddress instance', async () => {
      expect(result instanceof InvoiceAccountAddress).to.be.true();
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.invoiceAccountAddressId);
    });

    test('has the expected invoice account id value', async () => {
      expect(result.invoiceAccountId).to.equal(dbRow.invoiceAccountId);
    });

    experiment('date range', () => {
      test('is an instance of DateRange', async () => {
        expect(result.dateRange instanceof DateRange).to.be.true();
      });

      test('has the expected values', () => {
        const { dateRange } = result;
        expect(dateRange.startDate).to.equal(dbRow.startDate);
        expect(dateRange.endDate).to.equal(dbRow.endDate);
      });
    });

    experiment('when address is provided,', () => {
      let addressData;
      beforeEach(() => {
        addressData = {
          addressId: '11111111-1111-1111-1111-111111111111',
          address1: 'address 1',
          address2: 'address 2',
          address3: 'address 3',
          address4: 'address 4',
          town: 'town',
          county: 'county',
          postcode: 'AB12 3CD',
          country: 'country'
        };
        result = invoiceAccountAddressMapper.crmToModel({ ...dbRow, address: addressData });
      });

      test('it is a Address instance', () => {
        expect(result.address instanceof Address).to.be.true();
      });

      test('it has the expected values', () => {
        const { address } = result;
        expect(address.id).to.equal(addressData.addressId);
        expect(address.addressLine1).to.equal(addressData.address1);
        expect(address.addressLine2).to.equal(addressData.address2);
        expect(address.addressLine3).to.equal(addressData.address3);
        expect(address.addressLine4).to.equal(addressData.address4);
        expect(address.town).to.equal(addressData.town);
        expect(address.county).to.equal(addressData.county);
        expect(address.postcode).to.equal(addressData.postcode);
        expect(address.country).to.equal(addressData.country);
      });
    });

    experiment('when only an addressId is provided', () => {
      beforeEach(() => {
        result = invoiceAccountAddressMapper.crmToModel({ ...omit(dbRow, 'address'), addressId: dbRow.address.addressId });
      });

      test('it is a Address instance', () => {
        expect(result.address instanceof Address).to.be.true();
      });

      test('the id is set', () => {
        expect(result.address.id).to.equal(dbRow.address.addressId);
      });
    });

    experiment('when an address is not provided', () => {
      beforeEach(() => {
        result = invoiceAccountAddressMapper.crmToModel(omit(dbRow, 'address'));
      });

      test('it is not set', () => {
        expect(result.contact).to.be.undefined();
      });
    });

    experiment('when contact is provided,', () => {
      let contactData;
      beforeEach(() => {
        contactData = {
          contactId: '11111111-1111-1111-1111-111111111111',
          firstName: 'John',
          lastName: 'Testington',
          contactType: 'person'
        };
        result = invoiceAccountAddressMapper.crmToModel({ ...dbRow, contact: contactData });
      });

      test('it is a Contact instance', () => {
        expect(result.contact instanceof Contact).to.be.true();
      });

      test('it has the expected values', () => {
        const { contact } = result;
        expect(contact.id).to.equal(contactData.contactId);
        expect(contact.firstName).to.equal(contactData.firstName);
        expect(contact.lastName).to.equal(contactData.lastName);
        expect(contact.type).to.equal(contactData.contactType);
      });
    });

    experiment('when only a contactId is provided', () => {
      const contactId = '00000000-1111-1111-1111-111111111111';
      beforeEach(() => {
        result = invoiceAccountAddressMapper.crmToModel({ ...dbRow, contactId });
      });

      test('it is a Contact instance', () => {
        expect(result.contact instanceof Contact).to.be.true();
      });

      test('the id is set', () => {
        expect(result.contact.id).to.equal(contactId);
      });
    });

    experiment('when a contact is null,', () => {
      beforeEach(() => {
        result = invoiceAccountAddressMapper.crmToModel({ ...dbRow, contact: null });
      });

      test('it is not set', () => {
        expect(result.contact).to.be.undefined();
      });
    });

    experiment('when agentCompany is provided,', () => {
      let agentCompanyData;
      beforeEach(() => {
        agentCompanyData = {
          companyId: '11111111-1111-1111-1111-111111111111',
          name: 'company name',
          type: 'person',
          organisationType: 'individual'
        };
        result = invoiceAccountAddressMapper.crmToModel({ ...dbRow, agentCompany: agentCompanyData });
      });

      test('it is a Company instance', () => {
        expect(result.agentCompany instanceof Company).to.be.true();
      });

      test('it has the expected values', () => {
        const { agentCompany } = result;
        expect(agentCompany.id).to.equal(agentCompanyData.companyId);
        expect(agentCompany.name).to.equal(agentCompanyData.name);
        expect(agentCompany.type).to.equal(agentCompanyData.type);
        expect(agentCompany.organisationType).to.equal(agentCompanyData.organisationType);
      });
    });

    experiment('when only the agent company ID is provided,', () => {
      const agentCompanyId = '11111111-1111-1111-1111-111111111111';
      beforeEach(() => {
        result = invoiceAccountAddressMapper.crmToModel({ ...dbRow, agentCompanyId });
      });

      test('it is a Company instance', () => {
        expect(result.agentCompany instanceof Company).to.be.true();
      });

      test('the id is set', () => {
        const { agentCompany } = result;
        expect(agentCompany.id).to.equal(agentCompanyId);
      });
    });

    experiment('when the agent company is null,', () => {
      beforeEach(() => {
        result = invoiceAccountAddressMapper.crmToModel({ ...dbRow, agentCompany: null });
      });

      test('it is not set', () => {
        expect(result.agentCompany).to.be.undefined();
      });
    });
  });

  experiment('.pojoToModel', () => {
    let result;

    beforeEach(async () => {
      result = invoiceAccountAddressMapper.pojoToModel(pojo);
    });

    test('returns an InvoiceAccountAddress instance', async () => {
      expect(result instanceof InvoiceAccountAddress).to.be.true();
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(pojo.id);
    });

    test('has the expected invoice account id value', async () => {
      expect(result.invoiceAccountId).to.equal(pojo.invoiceAccountId);
    });

    experiment('date range', () => {
      test('is an instance of DateRange', async () => {
        expect(result.dateRange instanceof DateRange).to.be.true();
      });

      test('has the expected values', () => {
        const { dateRange } = result;
        expect(dateRange.startDate).to.equal(pojo.dateRange.startDate);
        expect(dateRange.endDate).to.equal(pojo.dateRange.endDate);
      });
    });

    experiment('address', () => {
      test('is an instance of Address', async () => {
        expect(result.address instanceof Address).to.be.true();
      });

      test('has the expected values', () => {
        const { address } = result;
        expect(address.addressLine1).to.equal(pojo.address.addressLine1);
        expect(address.addressLine2).to.equal(pojo.address.addressLine2);
        expect(address.addressLine3).to.equal(pojo.address.addressLine3);
        expect(address.addressLine4).to.equal(pojo.address.addressLine4);
        expect(address.postcode).to.equal(pojo.address.postcode);
        expect(address.country).to.equal(pojo.address.country);
      });
    });
  });
});
