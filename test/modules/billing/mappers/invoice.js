'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Invoice = require('../../../../src/lib/models/invoice');
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
});
