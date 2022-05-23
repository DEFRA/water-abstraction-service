'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');
const Company = require('../../../src/lib/models/company');
const Address = require('../../../src/lib/models/address');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';
const TEST_ACCOUNT_NUMBER = 'S12345678A';

experiment('lib/models/invoice-account', () => {
  let invoiceAccount;

  beforeEach(async () => {
    invoiceAccount = new InvoiceAccount();
  });

  experiment('construction', () => {
    test('can include an id', async () => {
      const company = new InvoiceAccount(TEST_GUID);
      expect(company.id).to.equal(TEST_GUID);
    });

    test('can omit the id', async () => {
      const company = new InvoiceAccount();
      expect(company.id).to.be.undefined();
    });

    test('sets invoice account addresses to an empty array ', async () => {
      const company = new InvoiceAccount();
      expect(company.invoiceAccountAddresses).to.equal([]);
    });
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

  experiment('.company', () => {
    test('can be set to a valid Company', async () => {
      const company = new Company();
      invoiceAccount.company = company;
      expect(invoiceAccount.company).to.equal(company);
    });

    test('throws an error if set to another model', async () => {
      const func = () => {
        invoiceAccount.company = new Address();
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        invoiceAccount.company = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.toJSON', () => {
    test('returns the expected object', async () => {
      const invoiceAccount = new InvoiceAccount();
      invoiceAccount.id = TEST_GUID;
      invoiceAccount.accountNumber = TEST_ACCOUNT_NUMBER;

      expect(invoiceAccount.toJSON()).to.equal({
        id: TEST_GUID,
        accountNumber: TEST_ACCOUNT_NUMBER,
        invoiceAccountAddresses: []
      });
    });
  });

  experiment('.invoiceAccountAddresses', () => {
    test('can be set to an array of InvoiceAccountAddress instances', async () => {
      const iaAddress = new InvoiceAccountAddress();
      invoiceAccount.invoiceAccountAddresses = [iaAddress];
      expect(invoiceAccount.invoiceAccountAddresses[0]).to.equal(iaAddress);
    });

    test('throws an error if set to another model', async () => {
      const func = () => {
        invoiceAccount.invoiceAccountAddresses = [new Company()];
      };
      expect(func).to.throw();
    });
  });

  experiment('.lastInvoiceAccountAddress', () => {
    beforeEach(async () => {
      const iaAddress1 = new InvoiceAccountAddress();
      iaAddress1.startDate = '2019-01-01';
      const iaAddress2 = new InvoiceAccountAddress();
      iaAddress2.startDate = '2020-01-01';
      invoiceAccount.invoiceAccountAddresses = [iaAddress1, iaAddress2];
    });

    test('gets the invoice account address with the most recent start date', async () => {
      const { lastInvoiceAccountAddress } = invoiceAccount;
      expect(lastInvoiceAccountAddress.startDate).to.equal('2020-01-01');
    });
  });
});
