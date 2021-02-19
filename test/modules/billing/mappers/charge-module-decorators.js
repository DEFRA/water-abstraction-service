'use strict';

const {
  experiment,
  test,
  before,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const Batch = require('../../../../src/lib/models/batch');
const FinancialYear = require('../../../../src/lib/models/financial-year');

const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const Licence = require('../../../../src/lib/models/licence');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Transaction = require('../../../../src/lib/models/transaction');
const DateRange = require('../../../../src/lib/models/date-range');
const Totals = require('../../../../src/lib/models/totals');

const chargeModuleDecorators = require('../../../../src/modules/billing/mappers/charge-module-decorators');
const { TransactionStatusError, InvoiceNumberError } = require('../../../../src/modules/billing/lib/errors');

const createInvoiceLicence = (transactions) => {
  const licence = new Licence();
  licence.fromHash({
    licenceNumber: '01/123/ABC'
  });
  const invoiceLicence = new InvoiceLicence();
  return invoiceLicence.fromHash({
    licence,
    transactions
  });
};

const createTransaction = financialYearEnding => {
  const transaction = new Transaction();
  return transaction.fromHash({
    externalId: `00000000-0000-0000-0000-00000000${financialYearEnding}`,
    chargePeriod: new DateRange('2020-04-01', '2021-03-31')
  });
};

const createInvoice = financialYearEnding => {
  const invoiceAccount = new InvoiceAccount();
  invoiceAccount.accountNumber = 'A12345678A';

  const invoice = new Invoice();
  invoice.fromHash({
    financialYear: new FinancialYear(financialYearEnding),
    invoiceAccount,
    invoiceLicences: [
      createInvoiceLicence([
        createTransaction(financialYearEnding)
      ])
    ]
  });

  return invoice;
};

const createBatch = () => {
  const batch = new Batch();
  return batch.fromHash({
    status: Batch.BATCH_STATUS.ready,
    invoices: [
      createInvoice(2019),
      createInvoice(2020)
    ]
  });
};

const createCMResponse = () => ({
  billRun: {
    summary: {
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
    customers: [{
      customerReference: 'A12345678A',
      summaryByFinancialYear: [{
        financialYear: 2018,
        creditLineCount: 0,
        creditLineValue: 0,
        debitLineCount: 1,
        debitLineValue: 123,
        netTotal: 123,
        deminimis: true,
        transactions: [{
          id: '00000000-0000-0000-0000-000000002019',
          licenceNumber: '01/123/ABC',
          chargeValue: 123,
          deminimis: true,
          minimumChargeAdjustment: false
        }]
      }, {
        financialYear: 2019,
        creditLineCount: 0,
        creditLineValue: 0,
        debitLineCount: 1,
        debitLineValue: 1230,
        netTotal: 1230,
        deminimis: false,
        transactions: [{
          id: '00000000-0000-0000-0000-000000002020',
          licenceNumber: '01/123/ABC',
          chargeValue: 1230,
          deminimis: false,
          minimumChargeAdjustment: false
        }]
      }]
    }]
  }
});

const secondCustomer = {
  customerReference: 'B12345678A',
  summaryByFinancialYear: [{
    financialYear: 2018,
    creditLineCount: 1,
    creditLineValue: 789,
    debitLineCount: 0,
    debitLineValue: 789,
    netTotal: -789,
    deminimis: true,
    transactions: [{
      id: '00000000-2222-0000-0000-000000002019',
      licenceNumber: '02/345/ABC',
      chargeValue: -789,
      deminimis: true,
      minimumChargeAdjustment: false
    }]
  }, {
    financialYear: 2019,
    creditLineCount: 0,
    creditLineValue: 0,
    debitLineCount: 1,
    debitLineValue: 1230,
    netTotal: 1230,
    deminimis: false,
    transactions: [{
      id: '00000000-2222-0000-0000-000000002020',
      licenceNumber: '02/345/ABC',
      chargeValue: 1230,
      deminimis: false,
      minimumChargeAdjustment: false
    }]
  }]
};

const createCMTransactions = (additionalTrans = []) => [{
  id: '00000000-0000-0000-0000-000000002019',
  customerReference: 'A12345678A',
  periodStart: '01-APR-2018',
  periodEnd: '31-MAR-2019',
  transactionReference: 'AAI1000001'
}, {
  id: '00000000-0000-0000-0000-000000002020',
  customerReference: 'A12345678A',
  periodStart: '01-MAY-2019',
  periodEnd: '31-MAR-2020',
  transactionReference: 'AAI1000002'
},
...additionalTrans
];

const cmMinimumChargeTransaction = {
  id: '00000000-0000-0000-1111-000000002020',
  licenceNumber: '01/123/ABC',
  chargeValue: 270,
  deminimis: false,
  minimumChargeAdjustment: true,
  periodStart: null,
  periodEnd: null,
  transactionReference: null
};

experiment('modules/billing/mappers/charge-module-decorators', () => {
  let batch, cmResponse, cmTransactions;

  beforeEach(async () => {
    batch = createBatch();
    cmResponse = createCMResponse();
    cmTransactions = createCMTransactions();
  });

  afterEach(() => sandbox.restore());

  experiment('when batch status is ready/sent', () => {
    let updatedBatch;

    beforeEach(async () => {
      updatedBatch = await chargeModuleDecorators.decorateBatch(batch, cmResponse, cmTransactions);
    });

    test('the batch has totals', async () => {
      expect(updatedBatch.totals).to.be.instanceof(Totals);
      sinon.assert.match(updatedBatch.totals.toJSON(), cmResponse.billRun.summary);
    });

    test('the 2019 invoice has the deminimis flag mapped correctly', async () => {
      expect(updatedBatch.invoices[0].isDeMinimis).to.equal(true);
    });

    test('the 2019 invoice has totals', async () => {
      const { totals } = updatedBatch.invoices[0];
      expect(totals).to.be.instanceof(Totals);
      expect(totals.toJSON()).to.equal({
        creditLineCount: 0,
        creditLineValue: 0,
        debitLineCount: 1,
        debitLineValue: 123,
        netTotal: 123
      });
    });

    test('the 2020 invoice has the deminimis flag mapped correctly', async () => {
      expect(updatedBatch.invoices[1].isDeMinimis).to.equal(false);
    });

    test('the 2019 transaction has the correct values', async () => {
      const [transaction] = updatedBatch.invoices[0].invoiceLicences[0].transactions;
      expect(transaction.value).to.equal(123);
      expect(transaction.isDeMinimis).to.be.true();
      expect(transaction.isMinimumCharge).to.be.false();
    });

    test('the 2020 invoice has totals', async () => {
      const { totals } = updatedBatch.invoices[1];
      expect(totals).to.be.instanceof(Totals);
      expect(totals.toJSON()).to.equal({
        creditLineCount: 0,
        creditLineValue: 0,
        debitLineCount: 1,
        debitLineValue: 1230,
        netTotal: 1230
      });
    });

    test('the 2020 transaction has the correct values', async () => {
      const [transaction] = updatedBatch.invoices[1].invoiceLicences[0].transactions;
      expect(transaction.value).to.equal(1230);
      expect(transaction.isDeMinimis).to.be.false();
      expect(transaction.isMinimumCharge).to.be.false();
    });

    test('invoice numbers are mapped when available', () => {
      expect(updatedBatch.invoices[0].invoiceNumber).to.equal('AAI1000001');
      expect(updatedBatch.invoices[1].invoiceNumber).to.equal('AAI1000002');
    });

    experiment('when there are multiple invoice numbers for a given financial year', () => {
      let cmResponse, cmTransactions;
      beforeEach(() => {
        cmResponse = createCMResponse();
        cmResponse.billRun.customers[0].summaryByFinancialYear[1].transactions.push(cmMinimumChargeTransaction);
        cmTransactions = createCMTransactions([{
          ...cmMinimumChargeTransaction,
          customerReference: 'A12345678A',
          transactionReference: 'AAI1000003'
        }]);
      });

      test('throws InvoiceNumberError', async () => {
        try {
          await chargeModuleDecorators.decorateBatch(batch, cmResponse, cmTransactions);
        } catch (err) {
          expect(err).to.be.instanceof(InvoiceNumberError);
          expect(err.message).to.equal('Invoice account A12345678A has multiple invoice numbers for financial year: 2019');
        }
      });
    });

    // Minimum charge transactions are created in the CM and do not exist
    // in the service. They are returned from the CM as "extra" transactions
    test('minimum charge transactions are mapped correctly', () => {
      cmResponse.billRun.customers[0].summaryByFinancialYear[1].transactions.push(cmMinimumChargeTransaction);
      updatedBatch = chargeModuleDecorators.decorateBatch(batch, cmResponse);

      const [, minChargeTxn] = updatedBatch.invoices[1].invoiceLicences[0].transactions;
      expect(minChargeTxn.value).to.equal(cmMinimumChargeTransaction.chargeValue);
      expect(minChargeTxn.isDeMinimis).to.be.false();
      expect(minChargeTxn.isMinimumCharge).to.be.true();
    });

    test('throws an error if an unexpected transaction is returned from the CM', async () => {
      const unexpectedTransaction = {
        id: '00000000-0000-0000-0000-00000min2020',
        licenceNumber: '01/123/ABC',
        chargeValue: 270,
        deminimis: false,
        minimumChargeAdjustment: false
      };
      cmResponse.billRun.customers[0].summaryByFinancialYear[1].transactions.push(unexpectedTransaction);

      try {
        await chargeModuleDecorators.decorateBatch(batch, cmResponse);
      } catch (err) {
        expect(err).to.be.instanceof(TransactionStatusError);
        expect(err.message).to.equal(`Unexpected Charge Module transaction externalId: ${unexpectedTransaction.id}`);
      }
    });
  });

  experiment('.mapCmTransactionsToSummary', () => {
    let cmResponse, cmTransactions;
    beforeEach(() => {
      cmResponse = createCMResponse();
      cmResponse.billRun.customers.push(secondCustomer);
      // add min charge transaction to 2019 summary for first customer
      cmResponse.billRun.customers[0].summaryByFinancialYear[1].transactions.push(cmMinimumChargeTransaction);
      cmTransactions = createCMTransactions([{
        ...cmMinimumChargeTransaction,
        customerReference: 'A12345678A'
      }, {
        id: '00000000-2222-0000-0000-000000002020',
        customerReference: 'B12345678A',
        periodStart: '01-JUN-2019',
        periodEnd: '31-MAR-2020',
        transactionReference: 'BAI1000001'
      }, {
        id: '00000000-2222-0000-0000-000000002019',
        customerReference: 'B12345678A',
        periodStart: '01-JUL-2018',
        periodEnd: '31-MAR-2019',
        transactionReference: 'BAI1000002'
      }]);
    });

    experiment('when cmTransactions is an empty object', () => {
      test('returns customers array from cmResponse object', () => {
        const result = chargeModuleDecorators.mapCmTransactionsToSummary(cmResponse, []);
        expect(result).to.equal(cmResponse.billRun.customers);
      });
    });

    experiment('maps cmTransactions into cm response customers', () => {
      let result;
      beforeEach(() => {
        result = chargeModuleDecorators.mapCmTransactionsToSummary(cmResponse, cmTransactions);
      });

      test('result has 2 customers', () => {
        expect(result).to.have.length(2);
      });

      experiment('first customer - A12345678A', () => {
        let customer;
        before(() => {
          customer = result.find(customer => customer.customerReference === 'A12345678A');
        });

        experiment('2019 financial summary', () => {
          let finYear;
          before(() => {
            finYear = customer.summaryByFinancialYear.find(finYear => finYear.financialYear === 2019);
          });

          test('has 2 transactions', () => {
            expect(finYear.transactions).to.have.length(2);
          });

          test('first transaction has expected data', () => {
            const transaction = finYear.transactions.find(txn => txn.id === '00000000-0000-0000-0000-000000002020');
            expect(transaction.periodStart).to.equal('01-MAY-2019');
            expect(transaction.periodEnd).to.equal('31-MAR-2020');
            expect(transaction.transactionReference).to.equal('AAI1000002');
          });

          test('second transaction is min charge has expected data', () => {
            const transaction = finYear.transactions.find(txn => txn.id === '00000000-0000-0000-1111-000000002020');
            expect(transaction.periodStart).to.equal(null);
            expect(transaction.periodEnd).to.equal(null);
            expect(transaction.transactionReference).to.equal(null);
          });
        });

        experiment('2018 financial summary', () => {
          let finYear;
          before(() => {
            finYear = customer.summaryByFinancialYear.find(finYear => finYear.financialYear === 2018);
          });

          test('has 1 transaction', () => {
            expect(finYear.transactions).to.have.length(1);
          });

          test('transaction has expected data', () => {
            const transaction = finYear.transactions.find(txn => txn.id === '00000000-0000-0000-0000-000000002019');
            expect(transaction.periodStart).to.equal('01-APR-2018');
            expect(transaction.periodEnd).to.equal('31-MAR-2019');
            expect(transaction.transactionReference).to.equal('AAI1000001');
          });
        });
      });

      experiment('second customer - B12345678A', () => {
        let customer;
        before(() => {
          customer = result.find(customer => customer.customerReference === 'B12345678A');
        });

        experiment('2019 financial summary', () => {
          let finYear;
          before(() => {
            finYear = customer.summaryByFinancialYear.find(finYear => finYear.financialYear === 2019);
          });

          test('has 1 transaction', () => {
            expect(finYear.transactions).to.have.length(1);
          });

          test('transaction has expected data', () => {
            const transaction = finYear.transactions.find(txn => txn.id === '00000000-2222-0000-0000-000000002020');
            expect(transaction.periodStart).to.equal('01-JUN-2019');
            expect(transaction.periodEnd).to.equal('31-MAR-2020');
            expect(transaction.transactionReference).to.equal('BAI1000001');
          });
        });

        experiment('2018 financial summary', () => {
          let finYear;
          before(() => {
            finYear = customer.summaryByFinancialYear.find(finYear => finYear.financialYear === 2018);
          });

          test('has 1 transaction', () => {
            expect(finYear.transactions).to.have.length(1);
          });

          test('transaction has expected data', () => {
            const transaction = finYear.transactions.find(txn => txn.id === '00000000-2222-0000-0000-000000002019');
            expect(transaction.periodStart).to.equal('01-JUL-2018');
            expect(transaction.periodEnd).to.equal('31-MAR-2019');
            expect(transaction.transactionReference).to.equal('BAI1000002');
          });
        });
      });
    });
  });
});
