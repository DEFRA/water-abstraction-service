const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { Invoice, InvoiceAccount, Address } =
  require('../../../src/lib/models');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

class TestClass {

}
const TEST_MODEL = new TestClass();

experiment('lib/models/invoice', () => {
  let invoice;

  beforeEach(async () => {
    invoice = new Invoice();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      invoice.id = TEST_GUID;
      expect(invoice.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        invoice.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.invoiceAccount', () => {
    let invoiceAccount;

    beforeEach(async () => {
      invoiceAccount = new InvoiceAccount();
    });
    test('can be set to an InvoiceAccount instance', async () => {
      invoice.invoiceAccount = invoiceAccount;
      expect(invoice.invoiceAccount).to.equal(invoiceAccount);
    });

    test('throws an error if set to the wrong model type', async () => {
      const func = () => {
        invoice.invoiceAccount = TEST_MODEL;
      };
      expect(func).to.throw();
    });
  });

  experiment('.address', () => {
    let address;

    beforeEach(async () => {
      address = new Address();
    });
    test('can be set to an Address instance', async () => {
      invoice.address = address;
      expect(invoice.address).to.equal(address);
    });

    test('throws an error if set to the wrong model type', async () => {
      const func = () => {
        invoice.address = TEST_MODEL;
      };
      expect(func).to.throw();
    });
  });
});
