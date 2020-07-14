'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');
const Company = require('../../../src/lib/models/company');

const invoiceAccountMapper = require('../../../src/lib/mappers/invoice-account');

const dbRow = {
  invoiceAccountId: '00000000-0000-0000-0000-000000000000',
  invoiceAccountNumber: 'A12345678A'
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

    test('has the expected account number value', async () => {
      expect(result.accountNumber).to.equal(dbRow.invoiceAccountNumber);
    });

    experiment('when company is provided,', () => {
      let companyData;
      beforeEach(() => {
        companyData = {
          companyId: '11111111-1111-1111-1111-111111111111',
          name: 'company name',
          type: 'person',
          organisationType: 'individual'
        };
        result = invoiceAccountMapper.crmToModel({ ...dbRow, company: companyData });
      });

      test('it is a Company instance', () => {
        expect(result.company instanceof Company).to.be.true();
      });

      test('it has the expected values', () => {
        const { company } = result;
        expect(company.id).to.equal(companyData.companyId);
        expect(company.name).to.equal(companyData.name);
        expect(company.type).to.equal(companyData.type);
        expect(company.organisationType).to.equal(companyData.organisationType);
      });
    });

    experiment('when invoice address is provided,', () => {
      let invoiceAccountAddressData;
      beforeEach(() => {
        invoiceAccountAddressData = {
          invoiceAccountAddressId: '11111111-1111-1111-1111-111111111111',
          startDate: '2020-04-01',
          endDate: null
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
});
