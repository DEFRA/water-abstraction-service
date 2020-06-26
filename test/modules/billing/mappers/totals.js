const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const totalsMapper = require('../../../../src/modules/billing/mappers/totals');
const Totals = require('../../../../src/lib/models/totals');

const INVOICE_ACCOUNT_NUMBER = 'A12345678A';

const data = {
  chargeModuleSummary: {
    creditNoteCount: 3,
    creditNoteValue: -245,
    invoiceCount: 2,
    invoiceValue: 100,
    creditLineCount: 6,
    creditLineValue: -245,
    debitLineCount: 4,
    debitLineValue: 100,
    netTotal: -145
  },
  billRun: {
    customers: [
      {
        customerReference: INVOICE_ACCOUNT_NUMBER,
        summaryByFinancialYear: [{
          financialYear: 2019,
          creditLineCount: 1,
          creditLineValue: -100,
          debitLineCount: 3,
          debitLineValue: 55,
          netTotal: -45
        }, {
          financialYear: 2020,
          creditLineCount: 2,
          creditLineValue: -10,
          debitLineCount: 4,
          debitLineValue: 75,
          netTotal: 65
        }]
      }
    ]
  },
  dbRow: {
    externalId: 223,
    invoiceCount: 4,
    creditNoteCount: 7,
    netTotal: 334
  }

};

experiment('modules/billing/mappers/totals', () => {
  experiment('.chargeModuleBillRunToBatchModel', () => {
    let result;

    beforeEach(async () => {
      result = totalsMapper.chargeModuleBillRunToBatchModel(data.chargeModuleSummary);
    });

    test('the result is a Totals instance', async () => {
      expect(result instanceof Totals).to.be.true();
    });

    const keys = [
      'creditNoteCount',
      'creditNoteValue',
      'invoiceCount',
      'invoiceValue',
      'creditLineCount',
      'creditLineValue',
      'debitLineCount',
      'debitLineValue',
      'netTotal'
    ];

    keys.forEach(key => {
      test(`The ${key} property has been correctly mapped`, async () => {
        expect(result[key]).to.equal(data.chargeModuleSummary[key]);
      });
    });
  });

  experiment('.chargeModuleBillRunToInvoiceModel', () => {
    let result;

    experiment('when the customer is present in the bill run summary', () => {
      beforeEach(async () => {
        result = totalsMapper.chargeModuleBillRunToInvoiceModel(data.billRun, INVOICE_ACCOUNT_NUMBER, 2021);
      });

      test('the result is a Totals instance', async () => {
        expect(result instanceof Totals).to.be.true();
      });

      test('the totals are selected for the correct financial year - the CM financial year is year starting', async () => {
        expect(result.creditLineCount).to.equal(2);
        expect(result.creditLineValue).to.equal(-10);
        expect(result.debitLineCount).to.equal(4);
        expect(result.debitLineValue).to.equal(75);
        expect(result.netTotal).to.equal(65);
      });
    });

    experiment('when the customer is not present in the bill run summary', () => {
      beforeEach(async () => {
        result = totalsMapper.chargeModuleBillRunToInvoiceModel(data.billRun, 'not-a-customer');
      });

      test('the result is null', async () => {
        expect(result).to.be.null();
      });
    });
  });

  experiment('.dbToModel', () => {
    let result;

    experiment('when the net total is null', () => {
      beforeEach(async () => {
        result = totalsMapper.dbToModel({
          netTotal: null
        });
      });

      test('returns null', async () => {
        expect(result).to.be.null();
      });
    });

    experiment('when the external ID field is not null', () => {
      beforeEach(async () => {
        result = totalsMapper.dbToModel(data.dbRow);
      });

      test('returns a Totals instance', async () => {
        expect(result instanceof Totals).to.be.true();
      });

      test('has the relevant properties populated', async () => {
        expect(result.creditNoteCount).to.equal(data.dbRow.creditNoteCount);
        expect(result.invoiceCount).to.equal(data.dbRow.invoiceCount);
        expect(result.netTotal).to.equal(data.dbRow.netTotal);
      });
    });
  });
});
