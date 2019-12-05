const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { InvoiceAccount } =
  require('../../../src/lib/models');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';
const TEST_ACCOUNT_NUMBER = 'S12345678A';

experiment('lib/models/invoice-account', () => {
  let invoiceAccount;

  beforeEach(async () => {
    invoiceAccount = new InvoiceAccount();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      invoiceAccount.id = TEST_GUID;
      expect(invoiceAccount.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        invoiceAccount.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.accountNumber', () => {
    test('can be set to a valid account number', async () => {
      invoiceAccount.accountNumber = TEST_ACCOUNT_NUMBER;
      expect(invoiceAccount.accountNumber).to.equal(TEST_ACCOUNT_NUMBER);
    });

    test('throws an error if set to an invalid account number', async () => {
      const func = () => {
        invoiceAccount.accountNumber = 'S1234A';
      };
      expect(func).to.throw();
    });
  });
});
