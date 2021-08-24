'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');

const Company = require('../../../src/lib/models/company');
const Contact = require('../../../src/lib/models/contact-v2');
const Invoice = require('../../../src/lib/models/invoice');
const Address = require('../../../src/lib/models/address');
const FinancialYear = require('../../../src/lib/models/financial-year');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');

const invoiceMapper = require('../../../src/lib/mappers/invoice');

const invoiceRow = {
  billingInvoiceId: '5a1577d7-8dc9-4d67-aadc-37d7ea85abca',
  invoiceAccountId: 'aea355f7-b931-4824-8465-575f5b95657f',
  invoiceAccountNumber: 'A12345678A',
  dateCreated: '2020-03-05T10:57:23.911Z',
  financialYearEnding: 2019,
  netAmount: '123',
  invoiceValue: 200,
  creditNoteValue: -77,
  legacyId: '12345:678',
  metadata: { foo: 'bar' },
  isFlaggedForRebilling: true,
  linkedBillingInvoices: [{
    billingInvoiceId: '5a1577d7-8dc9-4d67-aadc-37d7ea85abca',
    rebillingState: 'rebilled'
  },
  {
    billingInvoiceId: '4139a53a-a1f0-4dc9-bf1a-b97e41c5e866',
    rebillingState: 'reversal'
  }],
  originalBillingInvoice: {
    billingInvoiceId: '4139a53a-a1f0-4dc9-bf1a-b97e41c5e899',
    rebillingState: 'rebilled'
  },
  originalBillingInvoiceId: '4139a53a-a1f0-4dc9-bf1a-b97e41c5e899',
  billingBatchId: '4139a53a-a1f0-4dc9-bf1a-b97e41c5e899',
  rebillingState: 'rebilled'
};

experiment('lib/mappers/invoice', () => {
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

    test('has a financial year instance', async () => {
      expect(result.financialYear instanceof FinancialYear).to.be.true();
      expect(result.financialYear.yearEnding).to.equal(invoiceRow.financialYearEnding);
    });

    test('maps the invoice value and credit note value', () => {
      expect(result.invoiceValue).to.equal(invoiceRow.invoiceValue);
      expect(result.creditNoteValue).to.equal(invoiceRow.creditNoteValue);
    });

    test('maps the net total as an integer', () => {
      expect(result.netTotal).to.equal(123);
    });

    test('maps the legacy id', () => {
      expect(result.legacyId).to.equal(invoiceRow.legacyId);
    });

    test('maps the metadata', () => {
      expect(result.metadata).to.equal(invoiceRow.metadata);
    });

    test('maps the is flagged for rebilling', () => {
      expect(result.isFlaggedForRebilling).to.equal(invoiceRow.isFlaggedForRebilling);
    });

    test('maps the linked billing invoices for re-billing, excluding the current invoice', () => {
      const { linkedInvoices } = result;
      expect(linkedInvoices).to.be.an.array().length(2);
      expect(linkedInvoices[0].id).to.equal(invoiceRow.linkedBillingInvoices[1].billingInvoiceId);
      expect(linkedInvoices[1].id).to.equal(invoiceRow.originalBillingInvoiceId);
    });

    test('maps the batch id', () => {
      expect(result.billingBatchId).to.equal(invoiceRow.billingBatchId);
    });

    test('maps the rebillingStateLabels correctly', () => {
      expect(result.rebillingStateLabel).to.equal('rebilled');
      expect(result.linkedInvoices[0].rebillingStateLabel).to.equal('reversal');
      expect(result.linkedInvoices[1].rebillingStateLabel).to.equal('original');
    });
  });

  experiment('.modelToDB', () => {
    let result, invoice;

    beforeEach(async () => {
      invoice = new Invoice();
      invoice.invoiceAccount = new InvoiceAccount(uuid());
      invoice.invoiceAccount.accountNumber = 'A12345678A';
      invoice.financialYear = new FinancialYear(2020);
    });

    experiment('when the address is populated', () => {
      beforeEach(async () => {
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
        invoice.invoiceAccount = new InvoiceAccount().fromHash({
          accountNumber: 'A00000000A'
        });
        result = invoiceMapper.modelToDb(invoice);
      });

      test('maps to expected shape for the DB row', async () => {
        expect(result.invoiceAccountId).to.equal(invoice.invoiceAccount.id);
        expect(result.invoiceAccountNumber).to.equal(invoice.invoiceAccount.accountNumber);
        expect(result.address).to.equal(invoice.address.toJSON());
        // expect(result.billingBatchId).to.equal(batch.id);
        expect(result.financialYearEnding).to.equal(invoice.financialYear.yearEnding);
        expect(result.invoiceNumber).to.be.null();
        expect(result.netAmount).to.be.null();
        expect(result.isCredit).to.be.null();
      });
    });

    experiment('when the address is not populated', () => {
      beforeEach(async () => {
        result = invoiceMapper.modelToDb(invoice);
      });

      test('the address property is an empty object', async () => {
        expect(result.address).to.equal({});
      });
    });

    experiment('when the invoice number is populated', () => {
      test('it is mapped', () => {
        invoice.invoiceNumber = 'AAI1000000';
        const { invoiceNumber } = invoiceMapper.modelToDb(invoice);
        expect(invoiceNumber).to.equal('AAI1000000');
      });
    });

    experiment('when totals are present', () => {
      beforeEach(async () => {
        invoice.netTotal = 123;
        invoice.invoiceValue = 200;
        invoice.creditNoteValue = -77;
        result = invoiceMapper.modelToDb(invoice);
      });
      test('the totals are mapped', async () => {
        expect(invoice.netTotal).to.equal(123);
        expect(invoice.creditNoteValue).to.equal(-77);
        expect(invoice.invoiceValue).to.equal(200);
      });
    });
  });

  experiment('.crmToModel', () => {
    let result;

    const invoiceAccountId = uuid();
    const crmData = {
      invoiceAccountId,
      invoiceAccountNumber: 'A12345678A',
      company: {
        companyId: uuid(),
        name: 'Test company'
      },
      invoiceAccountAddresses: [
        {
          invoiceAccountId,
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
            country: 'UK',
            dataSource: 'nald'
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
