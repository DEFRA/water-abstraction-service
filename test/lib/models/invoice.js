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

  experiment('.getLicenceIds', () => {
    experiment('when there are licences', () => {
      test('returns an array of the unique ids', async () => {
        const id1 = uuid();
        const id2 = uuid();

        const licence1 = new Licence(id1);
        const licence2 = new Licence(id2);
        const licence3 = new Licence(id1);

        const invoiceLicence1 = new InvoiceLicence().fromHash({ licence: licence1 });
        const invoiceLicence2 = new InvoiceLicence().fromHash({ licence: licence2 });
        const invoiceLicence3 = new InvoiceLicence().fromHash({ licence: licence3 });

        const invoice = new Invoice();
        invoice.invoiceLicences = [invoiceLicence1, invoiceLicence2, invoiceLicence3];

        const licenceIds = invoice.getLicenceIds();

        expect(licenceIds.length).to.equal(2);
        expect(licenceIds).to.contain(id1);
        expect(licenceIds).to.contain(id2);
      });
    });

    experiment('when there are no licences', () => {
      test('returns an empty array', async () => {
        const invoice = new Invoice();
        expect(invoice.getLicenceIds()).to.equal([]);
      });
    });
  });

  experiment('.getInvoiceLicenceByLicenceNumber', () => {
    let invoiceLicenceA, invoiceLicenceB, invoice;

    const createInvoiceLicence = licenceNumber => {
      const licence = new Licence();
      licence.licenceNumber = licenceNumber;
      const invoiceLicence = new InvoiceLicence();
      return invoiceLicence.fromHash({ licence });
    };

    beforeEach(async () => {
      invoiceLicenceA = createInvoiceLicence('01/123');
      invoiceLicenceB = createInvoiceLicence('02/345');
      invoice = new Invoice();
      invoice.invoiceLicences = [invoiceLicenceA, invoiceLicenceB];
    });

    test('gets an invoice licence by licence number', async () => {
      expect(invoice.getInvoiceLicenceByLicenceNumber('02/345')).to.equal(invoiceLicenceB);
    });

    test('returns undefined if not found', async () => {
      expect(invoice.getInvoiceLicenceByLicenceNumber('01/999')).to.be.undefined();
    });
  });

  experiment('.isDeMinimis', () => {
    test('can be set to a boolean true', async () => {
      invoice.isDeMinimis = true;
      expect(invoice.isDeMinimis).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      invoice.isDeMinimis = false;
      expect(invoice.isDeMinimis).to.equal(false);
    });

    test('throws an error if set to a non-boolean', async () => {
      const func = () => {
        invoice.isDeMinimis = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.invoiceNumber', () => {
    test('can be set to a string', async () => {
      invoice.invoiceNumber = 'ABC123';
      expect(invoice.invoiceNumber).to.equal('ABC123');
    });

    test('can be set to null', async () => {
      invoice.invoiceNumber = null;
      expect(invoice.invoiceNumber).to.equal(null);
    });

    test('throws an error if set to a non-string', async () => {
      const func = () => {
        invoice.invoiceNumber = 1234;
      };
      expect(func).to.throw();
    });
  });

  experiment('.netTotal', () => {
    test('can be set to an integer', async () => {
      invoice.netTotal = 12345;
      expect(invoice.netTotal).to.equal(12345);
    });

    test('can be set to an integer string', async () => {
      invoice.netTotal = '12345';
      expect(invoice.netTotal).to.equal(12345);
    });

    test('can be set to null', async () => {
      invoice.netTotal = null;
      expect(invoice.netTotal).to.be.null();
    });

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        invoice.netTotal = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.isCredit', () => {
    test('can be set to a boolean true', async () => {
      invoice.isCredit = true;
      expect(invoice.isCredit).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      invoice.isCredit = false;
      expect(invoice.isCredit).to.equal(false);
    });

    test('throws an error if set to a non-boolean', async () => {
      const func = () => {
        invoice.isCredit = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.legacyId', () => {
    test('can be set to a string', async () => {
      invoice.legacyId = '12345:4358';
      expect(invoice.legacyId).to.equal('12345:4358');
    });

    test('can be set to null', async () => {
      invoice.legacyId = null;
      expect(invoice.legacyId).to.equal(null);
    });

    test('throws an error if set to a non-string and not null', async () => {
      const func = () => {
        invoice.legacyId = 13445;
      };
      expect(func).to.throw();
    });
  });

  experiment('.metadata', () => {
    test('can be set to an object', async () => {
      invoice.metadata = { foo: 'bar' };
      expect(invoice.metadata).to.equal({ foo: 'bar' });
    });

    test('can be set to null', async () => {
      invoice.metadata = null;
      expect(invoice.metadata).to.equal(null);
    });

    test('throws an error if set to a non-object', async () => {
      const func = () => {
        invoice.metadata = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.invoiceValue', () => {
    test('can be set to a positive integer', async () => {
      invoice.invoiceValue = 12345;
      expect(invoice.invoiceValue).to.equal(12345);
    });

    test('can be set to 0', async () => {
      invoice.invoiceValue = 0;
      expect(invoice.invoiceValue).to.equal(0);
    });

    test('can be set to null', async () => {
      invoice.invoiceValue = null;
      expect(invoice.invoiceValue).to.equal(null);
    });

    test('throws an error if set to a negative integer', async () => {
      const func = () => {
        invoice.invoiceValue = -1234;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        invoice.invoiceValue = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.creditNoteValue', () => {
    test('can be set to a negative integer', async () => {
      invoice.creditNoteValue = -12345;
      expect(invoice.creditNoteValue).to.equal(-12345);
    });

    test('can be set to 0', async () => {
      invoice.creditNoteValue = 0;
      expect(invoice.creditNoteValue).to.equal(0);
    });

    test('can be set to null', async () => {
      invoice.creditNoteValue = null;
      expect(invoice.creditNoteValue).to.equal(null);
    });

    test('throws an error if set to a positive integer', async () => {
      const func = () => {
        invoice.creditNoteValue = 1234;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a non-integer', async () => {
      const func = () => {
        invoice.creditNoteValue = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.isFlaggedForRebilling', () => {
    test('can be set to a boolean true', async () => {
      invoice.isFlaggedForRebilling = true;
      expect(invoice.isFlaggedForRebilling).to.equal(true);
    });

    test('can be set to a boolean false', async () => {
      invoice.isFlaggedForRebilling = false;
      expect(invoice.isFlaggedForRebilling).to.equal(false);
    });

    test('throws an error if set to a non-boolean', async () => {
      const func = () => {
        invoice.isFlaggedForRebilling = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.hasTransactionErrors', () => {
    test('is false when no underlying transactions have errors', async () => {
      const invoice = new Invoice().fromHash({
        invoiceLicences: [
          new InvoiceLicence().fromHash({
            transactions: [
              new Transaction(),
              new Transaction()
            ]
          })
        ]
      });
      expect(invoice.hasTransactionErrors).to.be.false();
    });

    test('is true when no underlying transactions have errors', async () => {
      const invoice = new Invoice().fromHash({
        invoiceLicences: [
          new InvoiceLicence().fromHash({
            transactions: [
              new Transaction(),
              new Transaction().fromHash({
                status: Transaction.statuses.error
              })
            ]
          })
        ]
      });
      expect(invoice.hasTransactionErrors).to.be.true();
    });
  });

  experiment('.toJSON', () => {
    test('includes the "hasTransactionErrors" property', async () => {
      invoice = new Invoice();
      expect(
        Object.keys(invoice.toJSON())
      ).to.include('hasTransactionErrors');
    });

    experiment('displayLabel, set to', () => {
      test('"de minimis bill" when isDeMinimis is true', async () => {
        invoice = new Invoice();
        invoice.fromHash({
          id: uuid(),
          isDeMinimis: true,
          legacyId: null,
          netTotal: 0,
          invoiceNumber: null
        });
        const result = invoice.toJSON();
        expect(result.displayLabel).to.equal('De minimis bill');
      });

      test('"NALD revised bill" when a legacy id is present', async () => {
        invoice = new Invoice();
        invoice.fromHash({
          id: uuid(),
          isDeMinimis: false,
          legacyId: '12345:583',
          netTotal: 0,
          invoiceNumber: null
        });
        const result = invoice.toJSON();
        expect(result.displayLabel).to.equal('NALD revised bill');
      });

      test('"zero value bill" when net amount is 0', async () => {
        invoice = new Invoice();
        invoice.fromHash({
          id: uuid(),
          isDeMinimis: false,
          legacyId: null,
          netTotal: 0,
          invoiceNumber: null
        });
        const result = invoice.toJSON();
        expect(result.displayLabel).to.equal('Zero value bill');
      });

      test('null if none of the expected criteria are met', async () => {
        invoice = new Invoice();
        invoice.fromHash({
          id: uuid(),
          isDeMinimis: false,
          legacyId: null,
          netTotal: 50,
          invoiceNumber: null
        });
        const result = invoice.toJSON();
        expect(result.displayLabel).to.equal(null);
      });
    });

    experiment('rebillinStateLabel, set to', () => {
      test('"original" when the id === original invoice id', async () => {
        const id = uuid();
        invoice = new Invoice();
        invoice.fromHash({
          id: id,
          legacyId: null,
          netTotal: 0,
          invoiceNumber: null,
          rebillingState: 'rebilled',
          originalInvoiceId: id
        });
        const result = invoice.toJSON();
        expect(result.rebillingStateLabel).to.equal('original');
      });

      test('"NALD revised bill" when a legacy id is present', async () => {
        const id = uuid();
        invoice = new Invoice();
        invoice.fromHash({
          id: id,
          legacyId: null,
          netTotal: 0,
          invoiceNumber: null,
          rebillingState: 'rebilled',
          originalInvoiceId: id
        });
        const result = invoice.toJSON();
        expect(result.displayLabel).to.equal('NALD revised bill');
      });

      // test('"zero value bill" when net amount is 0', async () => {
      //   invoice = new Invoice();
      //   invoice.fromHash({
      //     billingInvoiceId: uuid(),
      //     isDeMinimis: false,
      //     legacyId: null,
      //     netTotal: 0,
      //     invoiceNumber: null
      //   });
      //   const result = invoice.toJSON();
      //   expect(result.displayLabel).to.equal('Zero value bill');
      // });

      // test('null if none of the expected criteria are met', async () => {
      //   invoice = new Invoice();
      //   invoice.fromHash({
      //     billingInvoiceId: uuid(),
      //     isDeMinimis: false,
      //     legacyId: null,
      //     netTotal: 50,
      //     invoiceNumber: null
      //   });
      //   const result = invoice.toJSON();
      //   expect(result.displayLabel).to.equal(null);
      // });
    });
  });

  experiment('.rebillingState', () => {
    test('can be set to "rebill"', async () => {
      invoice.rebillingState = 'rebill';
      expect(invoice.rebillingState).to.equal('rebill');
    });

    test('can be set to "reversal"', async () => {
      invoice.rebillingState = 'reversal';
      expect(invoice.rebillingState).to.equal('reversal');
    });

    test('can be set to "reversal"', async () => {
      invoice.rebillingState = 'rebilled';
      expect(invoice.rebillingState).to.equal('rebilled');
    });

    test('can be set to null', async () => {
      invoice.rebillingState = null;
      expect(invoice.rebillingState).to.equal(null);
    });

    test('throws an error if set to another string', async () => {
      const func = () => {
        invoice.isFlaggedForRebilling = 'invalid-state';
      };
      expect(func).to.throw();
    });
  });

  experiment('.originalInvoiceId', () => {
    test('can be set to guid', async () => {
      const id = uuid();
      invoice.originalInvoiceId = id;
      expect(invoice.originalInvoiceId).to.equal(id);
    });

    test('can be set to null', async () => {
      invoice.originalInvoiceId = null;
      expect(invoice.originalInvoiceId).to.equal(null);
    });

    test('throws an error if not a guid', async () => {
      const func = () => {
        invoice.originalInvoiceId = 'invalid-state';
      };
      expect(func).to.throw();
    });
  });

  experiment('.billingBatchId', () => {
    test('can be set to guid', async () => {
      const id = uuid();
      invoice.billingBatchId = id;
      expect(invoice.billingBatchId).to.equal(id);
    });

    test('can be set to null', async () => {
      const func = () => {
        invoice.billingBatchId = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if not a guid', async () => {
      const func = () => {
        invoice.billingBatchId = 'invalid-state';
      };
      expect(func).to.throw();
    });
  });

  experiment('.linkedInvoices', () => {
    test('can be set to an array of invoice instances', async () => {
      const arr = [
        new Invoice(uuid()),
        new Invoice(uuid())
      ];
      invoice.linkedInvoices = arr;
      expect(invoice.linkedInvoices).to.equal(arr);
    });

    test('throws an error if not Invoice models', async () => {
      const func = () => {
        const arr = [
          new Invoice(uuid()),
          new InvoiceAccount(uuid())
        ];
        invoice.linkedInvoices = arr;
      };
      expect(func).to.throw();
    });
  });
});
