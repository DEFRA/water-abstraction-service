'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');

const Batch = require('../../../../src/lib/models/batch');
const Company = require('../../../../src/lib/models/company');
const Contact = require('../../../../src/lib/models/contact-v2');
const Invoice = require('../../../../src/lib/models/invoice');
const Address = require('../../../../src/lib/models/address');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');

const invoiceMapper = require('../../../../src/modules/billing/mappers/invoice');

const invoiceRow = {
  billingInvoiceId: '5a1577d7-8dc9-4d67-aadc-37d7ea85abca',
  invoiceAccountId: 'aea355f7-b931-4824-8465-575f5b95657f',
  invoiceAccountNumber: 'A12345678A',
  dateCreated: '2020-03-05T10:57:23.911Z'
};

experiment('modules/billing/mappers/invoice', () => {
  experiment('.dbToModel', () => {
    let result;

    beforeEach(async () => {
      result = invoiceMapper.dbToModel(invoiceRow);
    });

    test('returns an Invoice instance with correct ID', async () => {
      expect(result instanceof Invoice).to.be.true();
      expect(result.id).to.equal(invoiceRow.billingInvoiceId);
    });

    test('has an invoiceAccount property which is an InvoiceAccount instance', async () => {
      const { invoiceAccount } = result;
      expect(invoiceAccount instanceof InvoiceAccount).to.be.true();
      expect(invoiceAccount.id).to.equal(invoiceRow.invoiceAccountId);
      expect(invoiceAccount.accountNumber).to.equal(invoiceRow.invoiceAccountNumber);
    });

    test('maps the date created value', async () => {
      expect(result.dateCreated).to.equal(invoiceRow.dateCreated);
    });
  });

  experiment('.modelToDB', () => {
    let result;

    const batch = new Batch(uuid());
    const invoice = new Invoice();
    invoice.invoiceAccount = new InvoiceAccount(uuid());
    invoice.invoiceAccount.accountNumber = 'A12345678A';
    invoice.address = new Address();
    invoice.address.fromHash({
      addressLine1: 'Test farm',
      addressLine2: 'Test lane',
      addressLine3: 'Test meadow',
      addressLine4: 'Test hill',
      town: 'Testington',
      county: 'Testingshire',
      postcode: 'TT1 1TT',
      country: 'UK'
    });

    beforeEach(async () => {
      result = invoiceMapper.modelToDb(batch, invoice);
    });

    test('maps to expected shape for the DB row', async () => {
      expect(result.invoiceAccountId).to.equal(invoice.invoiceAccount.id);
      expect(result.invoiceAccountNumber).to.equal(invoice.invoiceAccount.accountNumber);
      expect(result.address).to.equal(invoice.address.toJSON());
      expect(result.billingBatchId).to.equal(batch.id);
    });
  });

  experiment('.crmToModel', () => {
    let result;

    const crmData = {
      invoiceAccountId: uuid(),
      invoiceAccountNumber: 'A12345678A',
      company: {
        companyId: uuid(),
        name: 'Test company'
      },
      invoiceAccountAddresses: [
        {
          startDate: '2015-01-01',
          address: {
            addressId: uuid(),
            address1: 'Test farm',
            address2: 'Test lane',
            address3: 'Test meadow',
            address4: 'Test hill',
            town: 'Testington',
            county: 'Testingshire',
            postcode: 'TT1 1TT',
            country: 'UK'
          },
          agentCompany: {
            companyId: uuid(),
            name: 'Test agent company'
          },
          contact: {
            contactId: uuid(),
            salutation: 'Sir',
            firstName: 'Bob',
            lastName: 'Bobbins',
            initials: null
          }
        }]
    };

    beforeEach(async () => {
      result = invoiceMapper.crmToModel(crmData);
    });

    test('returns an Invoice', async () => {
      expect(result instanceof Invoice).to.be.true();
    });

    test('includes the invoice account', async () => {
      const { invoiceAccount } = result;
      expect(invoiceAccount instanceof InvoiceAccount).to.be.true();
      expect(invoiceAccount.id).to.equal(crmData.invoiceAccountId);
      expect(invoiceAccount.accountNumber).to.equal(crmData.invoiceAccountNumber);
    });

    test('includes the invoice account address', async () => {
      const { address } = result;
      const { address: iaAddress } = crmData.invoiceAccountAddresses[0];
      expect(address instanceof Address).to.be.true();
      expect(address.id).to.equal(iaAddress.addressId);
      expect(address.addressLine1).to.equal(iaAddress.address1);
      expect(address.addressLine2).to.equal(iaAddress.address2);
      expect(address.addressLine3).to.equal(iaAddress.address3);
      expect(address.addressLine4).to.equal(iaAddress.address4);
      expect(address.town).to.equal(iaAddress.town);
      expect(address.county).to.equal(iaAddress.county);
      expect(address.postcode).to.equal(iaAddress.postcode);
      expect(address.country).to.equal(iaAddress.country);
    });

    test('includes the agent company', async () => {
      const { agentCompany } = result;
      const { agentCompany: iaAgentCompany } = crmData.invoiceAccountAddresses[0];
      expect(agentCompany instanceof Company).to.be.true();
      expect(agentCompany.id).to.equal(iaAgentCompany.companyId);
      expect(agentCompany.name).to.equal(iaAgentCompany.name);
    });

    test('includes the FAO contact', async () => {
      const { contact } = result;
      const { contact: iaContact } = crmData.invoiceAccountAddresses[0];
      expect(contact instanceof Contact).to.be.true();
      expect(contact.id).to.equal(iaContact.contactId);
    });
  });
});
