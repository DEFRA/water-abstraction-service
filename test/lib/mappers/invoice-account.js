'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');
const Company = require('../../../src/lib/models/company');
const DateRange = require('../../../src/lib/models/date-range');

const invoiceAccountMapper = require('../../../src/lib/mappers/invoice-account');

const dbRow = {
  invoiceAccountId: '00000000-0000-0000-0000-000000000000',
  invoiceAccountNumber: 'A12345678A',
  lastTransactionFileReference: 'some-file',
  dateLastTransactionFileReferenceUpdated: '2010-10-10',
  startDate: '2010-10-05',
  dateCreated: '2010-10-05',
  endDate: null,
  company: {
    companyId: '11111111-1111-1111-1111-111111111111',
    name: 'company name',
    type: Company.COMPANY_TYPES.person,
    organisationType: Company.ORGANISATION_TYPES.individual
  }
};

experiment('modules/billing/mappers/invoice-account', () => {
  experiment('.crmToModel', () => {
    let result;

    beforeEach(async () => {
      result = invoiceAccountMapper.crmToModel(dbRow);
    });

    test('returns an Address instance', async () => {
      expect(result instanceof InvoiceAccount).to.be.true();
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.invoiceAccountId);
    });

    experiment('dateRange', () => {
      test('is a DateRange instance', () => {
        expect(result.dateRange instanceof DateRange).to.be.true();
      });

      test('has the expected values', () => {
        const { dateRange } = result;
        expect(dateRange.startDate).to.equal(dbRow.startDate);
        expect(dateRange.endDate).to.equal(dbRow.endDate);
      });
    });

    test('has the expected account number value', async () => {
      expect(result.accountNumber).to.equal(dbRow.invoiceAccountNumber);
    });

    test('has the expected lastTransactionFileReference', async () => {
      expect(result.lastTransactionFileReference).to.equal(dbRow.lastTransactionFileReference);
    });

    test('has the expected dateLastTransactionFileReferenceUpdated', async () => {
      expect(result.dateLastTransactionFileReferenceUpdated).to.equal(dbRow.dateLastTransactionFileReferenceUpdated);
    });

    experiment('company', () => {
      test('s a Company instance', () => {
        expect(result.company instanceof Company).to.be.true();
      });

      test('has the expected values', () => {
        const { company } = result;
        expect(company.id).to.equal(dbRow.company.companyId);
        expect(company.name).to.equal(dbRow.company.name);
        expect(company.type).to.equal(dbRow.company.type);
        expect(company.organisationType).to.equal(dbRow.company.organisationType);
      });
    });

    experiment('when invoice address is provided,', () => {
      let invoiceAccountAddressData;
      beforeEach(() => {
        invoiceAccountAddressData = {
          invoiceAccountAddressId: '11111111-1111-1111-1111-111111111111',
          invoiceAccountId: '00000000-0000-0000-0000-000000000000',
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
        result = invoiceAccountMapper.crmToModel({ ...dbRow, invoiceAccountAddresses: [invoiceAccountAddressData] });
      });

      test('it is a InvoiceAccountAddress instance', () => {
        expect(result.invoiceAccountAddresses[0] instanceof InvoiceAccountAddress).to.be.true();
      });

      test('it has the expected values', () => {
        const { invoiceAccountAddresses: [invoiceAccountAddress] } = result;
        expect(invoiceAccountAddress.id).to.equal(invoiceAccountAddressData.invoiceAccountAddressId);
        expect(invoiceAccountAddress.dateRange.startDate).to.equal(invoiceAccountAddressData.startDate);
        expect(invoiceAccountAddress.dateRange.endDate).to.equal(invoiceAccountAddressData.endDate);
      });
    });
  });

  experiment('.pojoToModel', () => {
    let result;

    const obj = {
      id: uuid(),
      accountNumber: 'A11111111A',
      dateRange: { startDate: '2012-01-01' },
      company: {
        id: uuid(),
        name: 'Big Co Ltd'
      },
      invoiceAccountAddresses: [{
        id: uuid(),
        invoiceAccountId: uuid(),
        address: {
          addressLine2: '123',
          addressLine3: 'Test Lane',
          postcode: 'TT1 1TT'
        }
      }]
    };

    beforeEach(async () => {
      result = invoiceAccountMapper.pojoToModel(obj);
    });

    test('an InvoiceAccount model is returned', async () => {
      expect(result).to.be.an.instanceof(InvoiceAccount);
    });

    test('the .id property is mapped', async () => {
      expect(result.id).to.equal(obj.id);
    });

    test('the .accountNumber property is mapped', async () => {
      expect(result.accountNumber).to.equal(obj.accountNumber);
    });

    test('the .dateRange property is mapped', async () => {
      expect(result.dateRange).to.be.an.instanceof(DateRange);
      expect(result.dateRange.startDate).to.equal(obj.dateRange.startDate);
    });

    test('the .company property is mapped', async () => {
      expect(result.company).to.be.an.instanceof(Company);
      expect(result.company.id).to.equal(obj.company.id);
    });

    test('the .invoiceAccountAddresses property is mapped', async () => {
      const invoiceAccountAddress = result.invoiceAccountAddresses[0];
      expect(result.invoiceAccountAddresses[0]).to.be.an.instanceof(InvoiceAccountAddress);
      expect(invoiceAccountAddress.id).to.equal(obj.invoiceAccountAddresses[0].id);
      expect(invoiceAccountAddress.invoiceAccountId).to.equal(obj.invoiceAccountAddresses[0].invoiceAccountId);
      expect(invoiceAccountAddress.address.addressLine2).to.equal(obj.invoiceAccountAddresses[0].address.addressLine2);
      expect(invoiceAccountAddress.address.addressLine3).to.equal(obj.invoiceAccountAddresses[0].address.addressLine3);
      expect(invoiceAccountAddress.address.postcode).to.equal(obj.invoiceAccountAddresses[0].address.postcode);
    });
  });
});
