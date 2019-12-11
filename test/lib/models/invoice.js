'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const Invoice = require('../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const Address = require('../../../src/lib/models/address');
const InvoiceLicence = require('../../../src/lib/models/invoice-licence');
const Licence = require('../../../src/lib/models/licence');
const Transaction = require('../../../src/lib/models/transaction');
const Contact = require('../../../src/lib/models/contact-v2');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

class TestClass {

}
const TEST_MODEL = new TestClass();

experiment('lib/models/invoice', () => {
  let invoice;

  beforeEach(async () => {
    invoice = new Invoice();
  });

  experiment('construction', () => {
    test('can include an id in the constructor', async () => {
      const inv = new Invoice(TEST_GUID);
      expect(inv.id).to.equal(TEST_GUID);
    });

    test('can omit the id in the constructor', async () => {
      const inv = new Invoice();
      expect(inv.id).to.be.undefined();
    });
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

  experiment('.getTotals', () => {
    let invoice;
    let totals;

    beforeEach(async () => {
      const tx1 = new Transaction('00000000-0000-0000-0000-000000000001', 100, true);
      const tx2 = new Transaction('00000000-0000-0000-0000-000000000002', 200, false);
      const tx3 = new Transaction('00000000-0000-0000-0000-000000000003', 300, false);
      const tx4 = new Transaction('00000000-0000-0000-0000-000000000004', 400, true);
      const tx5 = new Transaction('00000000-0000-0000-0000-000000000005', 500, false);
      const tx6 = new Transaction('00000000-0000-0000-0000-000000000006', 600, false);
      const invoiceLicence1 = new InvoiceLicence();
      const invoiceLicence2 = new InvoiceLicence();
      invoiceLicence1.transactions = [tx1, tx2, tx3, tx4];
      invoiceLicence2.transactions = [tx5, tx6];

      invoice = new Invoice();
      invoice.invoiceLicences = [invoiceLicence1, invoiceLicence2];

      totals = invoice.getTotals();
    });

    test('includes the total invoice value', async () => {
      const expectedTotal =
        (200 + 300 + 500 + 600) - // invoices
        (100 + 400); // credits

      expect(totals.totalValue).to.equal(expectedTotal);
    });

    test('includes the total value of credits', async () => {
      const expectedTotal = 100 + 400;
      expect(totals.totalCredits).to.equal(expectedTotal);
    });

    test('includes the number of credits', async () => {
      expect(totals.numberOfCredits).to.equal(2);
    });

    test('includes the total value of invoices', async () => {
      const expectedTotal = 200 + 300 + 500 + 600;
      expect(totals.totalInvoices).to.equal(expectedTotal);
    });

    test('includes the number of invoices', async () => {
      expect(totals.numberOfInvoices).to.equal(4);
    });
  });

  experiment('.getLicenceNumbers', () => {
    test('returns the licence numbers as an array', async () => {
      const licence1 = new Licence();
      const licence2 = new Licence();
      const licence3 = new Licence();
      licence1.licenceNumber = 'LIC1';
      licence2.licenceNumber = 'LIC2';
      licence3.licenceNumber = 'LIC3';

      const invoiceLicence1 = new InvoiceLicence();
      const invoiceLicence2 = new InvoiceLicence();
      const invoiceLicence3 = new InvoiceLicence();

      invoiceLicence1.licence = licence1;
      invoiceLicence2.licence = licence2;
      invoiceLicence3.licence = licence3;

      const invoice = new Invoice();
      invoice.invoiceLicences = [invoiceLicence1, invoiceLicence2, invoiceLicence3];

      expect(invoice.getLicenceNumbers()).to.equal(['LIC1', 'LIC2', 'LIC3']);
    });

    test('returns an empty array if there is no licence data', async () => {
      const invoice = new Invoice();
      expect(invoice.getLicenceNumbers()).to.equal([]);
    });
  });

  experiment('.getMinimumPaymentTopUp', () => {
    let invoice;

    beforeEach(async () => {
      const invoiceLicence = new InvoiceLicence();
      invoice = new Invoice();
      invoice.invoiceLicences = [invoiceLicence];
    });

    experiment('when the invoice has £25 of transactions', () => {
      test('no top up is required', async () => {
        const tx = new Transaction('00000000-0000-0000-0000-000000000001', 25 * 100);
        invoice.invoiceLicences[0].transactions = [tx];

        const topUp = invoice.getMinimumPaymentTopUp();
        expect(topUp).to.equal(0);
      });
    });

    experiment('when the invoice has more than £25 of transactions', () => {
      test('no top up is required', async () => {
        const tx = new Transaction('00000000-0000-0000-0000-000000000001', 35 * 100);
        invoice.invoiceLicences[0].transactions = [tx];

        const topUp = invoice.getMinimumPaymentTopUp();
        expect(topUp).to.equal(0);
      });
    });

    experiment('when the invoice has less than £25 of transactions', () => {
      test('a top up is required', async () => {
        const tx = new Transaction('00000000-0000-0000-0000-000000000001', 24 * 100);
        invoice.invoiceLicences[0].transactions = [tx];

        const topUp = invoice.getMinimumPaymentTopUp();
        expect(topUp).to.equal(100);
      });
    });
  });

  experiment('.getInvoiceLicenceContacts', () => {
    test('returns an empty array if no InvoiceLicences', () => {
      const invoice = new Invoice();
      expect(invoice.getInvoiceLicenceContacts()).to.equal([]);
    });

    test('returns an empty array if InvoiceLicences have no contacts', () => {
      const invoice = new Invoice();
      invoice.invoiceLicences = [
        new InvoiceLicence(),
        new InvoiceLicence(),
        new InvoiceLicence()
      ];
      expect(invoice.getInvoiceLicenceContacts()).to.equal([]);
    });

    test('returns all contacts when no duplicates', async () => {
      const invoiceLicence1 = new InvoiceLicence();
      invoiceLicence1.contact = new Contact(uuid());

      const invoiceLicence2 = new InvoiceLicence();
      invoiceLicence2.contact = new Contact(uuid());

      const invoiceLicence3 = new InvoiceLicence();
      invoiceLicence3.contact = new Contact(uuid());

      const invoice = new Invoice();
      invoice.invoiceLicences = [invoiceLicence1, invoiceLicence2, invoiceLicence3];

      const contacts = invoice.getInvoiceLicenceContacts();

      expect(contacts).to.have.length(3);
      expect(contacts.find(contact => contact.id === invoiceLicence1.contact.id)).to.exist();
      expect(contacts.find(contact => contact.id === invoiceLicence2.contact.id)).to.exist();
      expect(contacts.find(contact => contact.id === invoiceLicence3.contact.id)).to.exist();
    });

    test('returns unique contacts when duplicates', async () => {
      const sharedContactId = uuid();
      const invoiceLicence1 = new InvoiceLicence();
      invoiceLicence1.contact = new Contact(sharedContactId);

      const invoiceLicence2 = new InvoiceLicence();
      invoiceLicence2.contact = new Contact(sharedContactId);

      const invoiceLicence3 = new InvoiceLicence();
      invoiceLicence3.contact = new Contact(uuid());

      const invoice = new Invoice();
      invoice.invoiceLicences = [invoiceLicence1, invoiceLicence2, invoiceLicence3];

      const contacts = invoice.getInvoiceLicenceContacts();

      expect(contacts).to.have.length(2);
      expect(contacts.find(contact => contact.id === sharedContactId)).to.exist();
      expect(contacts.find(contact => contact.id === invoiceLicence3.contact.id)).to.exist();
    });
  });
});
