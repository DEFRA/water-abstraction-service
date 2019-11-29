const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { Batch, FinancialYear, Invoice, InvoiceAccount } =
  require('../../../src/lib/models');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';
const TEST_FINANCIAL_YEAR = new FinancialYear(2020);

class TestClass {

}
const TEST_MODEL = new TestClass();

const createInvoice = accountNumber => {
  const invoice = new Invoice();
  invoice.invoiceAccount = new InvoiceAccount();
  invoice.invoiceAccount.accountNumber = accountNumber;
  return invoice;
};

experiment('lib/models/batch', () => {
  let batch;

  beforeEach(async () => {
    batch = new Batch();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      batch.id = TEST_GUID;
      expect(batch.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        batch.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.type', () => {
    test('can be set to "annual"', async () => {
      batch.type = 'annual';
      expect(batch.type).to.equal('annual');
    });

    test('can be set to "supplementary"', async () => {
      batch.type = 'supplementary';
      expect(batch.type).to.equal('supplementary');
    });

    test('can be set to "two_part_tariff"', async () => {
      batch.type = 'two_part_tariff';
      expect(batch.type).to.equal('two_part_tariff');
    });

    test('cannot be set to an invalid type', async () => {
      const func = () => {
        batch.type = 'invalid_type';
      };
      expect(func).to.throw();
    });
  });

  experiment('.season', () => {
    test('can be set to "summer"', async () => {
      batch.season = 'summer';
      expect(batch.season).to.equal('summer');
    });

    test('can be set to "winter"', async () => {
      batch.season = 'winter';
      expect(batch.season).to.equal('winter');
    });

    test('can be set to "all year"', async () => {
      batch.season = 'all year';
      expect(batch.season).to.equal('all year');
    });

    test('cannot be set to an invalid season', async () => {
      const func = () => {
        batch.season = 'autumn';
      };
      expect(func).to.throw();
    });
  });

  experiment('.startYear', () => {
    test('can be set to a FinancialYear instance', async () => {
      batch.startYear = TEST_FINANCIAL_YEAR;
      expect(batch.startYear.endYear).to.equal(2020);
    });

    test('cannot be set to a different model', async () => {
      const func = () => {
        batch.startYear = TEST_MODEL;
      };
      expect(func).to.throw();
    });
  });

  experiment('.endYear', () => {
    test('can be set to a FinancialYear instance', async () => {
      batch.endYear = TEST_FINANCIAL_YEAR;
      expect(batch.endYear.endYear).to.equal(2020);
    });

    test('cannot be set to a different model', async () => {
      const func = () => {
        batch.endYear = TEST_MODEL;
      };
      expect(func).to.throw();
    });
  });

  experiment('.status', () => {
    test('can be set to "processing"', async () => {
      batch.status = 'processing';
      expect(batch.status).to.equal('processing');
    });

    test('can be set to "complete"', async () => {
      batch.status = 'complete';
      expect(batch.status).to.equal('complete');
    });

    test('can be set to "error"', async () => {
      batch.status = 'error';
      expect(batch.status).to.equal('error');
    });

    test('cannot be set to an invalid status', async () => {
      const func = () => {
        batch.status = 'pondering';
      };
      expect(func).to.throw();
    });
  });

  experiment('.addInvoice()', () => {
    let invoice;

    beforeEach(async () => {
      invoice = createInvoice('S12345678A');
    });

    test('can add an Invoice', async () => {
      batch.addInvoice(invoice);
      expect(batch.invoices[0].invoiceAccount.accountNumber).to.equal('S12345678A');
    });

    test('cannot add a different model', async () => {
      const func = () => {
        batch.addInvoice(TEST_MODEL);
      };
      expect(func).to.throw();
    });

    test('cannot add an Invoice with the same account number more than once', async () => {
      batch.addInvoice(invoice);
      const func = () => {
        batch.addInvoice(invoice);
      };
      expect(func).to.throw();
    });
  });

  experiment('.addInvoices', () => {
    let invoices;

    beforeEach(async () => {
      invoices = [createInvoice('S12345678A'), createInvoice('S87654321A')];
    });

    test('can add an array of invoices', async () => {
      batch.addInvoices(invoices);
      expect(batch.invoices.length).to.equal(2);
    });

    test('throws an error if argument not an array', async () => {
      const func = () => {
        batch.addInvoices('not-an-array');
      };
      expect(func).to.throw();
    });

    test('throws an error if array elements are not Invoice', async () => {
      const func = () => {
        batch.addInvoices([TEST_MODEL]);
      };
      expect(func).to.throw();
    });
  });

  experiment('.getInvoiceByAccountNumber', () => {
    let invoices;

    beforeEach(async () => {
      invoices = [createInvoice('S12345678A'), createInvoice('S87654321A')];
      batch.addInvoices(invoices);
    });

    test('gets an invoice when an invoice with the account number is found', async () => {
      const invoice = batch.getInvoiceByAccountNumber('S87654321A');
      expect(invoice.invoiceAccount.accountNumber).to.equal('S87654321A');
    });

    test('returns undefined when an invoice with the account number is not found', async () => {
      const invoice = batch.getInvoiceByAccountNumber('NOT_HERE');
      expect(invoice).to.equal(undefined);
    });
  });
});
