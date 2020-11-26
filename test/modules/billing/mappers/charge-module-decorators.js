'use strict';

const {
  experiment,
  test,
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
const chargeModuleTransactionConnector = require('../../../../src/lib/connectors/charge-module/transactions');
const { TransactionStatusError } = require('../../../../src/modules/billing/lib/errors');

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

const cmMinimumChargeTransaction = {
  id: '00000000-0000-0000-1111-000000002020',
  licenceNumber: '01/123/ABC',
  chargeValue: 270,
  deminimis: false,
  minimumChargeAdjustment: true
};

experiment('modules/billing/mappers/charge-module-decorators', () => {
  let batch, cmResponse;

  beforeEach(async () => {
    sandbox.stub(chargeModuleTransactionConnector, 'get').resolves({
      transaction: {
        ...cmMinimumChargeTransaction,
        periodStart: '2020-04-01',
        periodEnd: '2021-03-31',
        lineDescription: 'minimum charge transaction',
        credit: false,
        compensationCharge: false,
        newLicence: true
      }
    });

    batch = createBatch();
    cmResponse = createCMResponse();
  });

  afterEach(() => sandbox.restore());

  experiment('when batch status is ready/sent', () => {
    let updatedBatch;

    beforeEach(async () => {
      updatedBatch = await chargeModuleDecorators.decorateBatch(batch, cmResponse);
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

    // Minimum charge transactions are created in the CM and do not exist
    // in the service. They are returned from the CM as "extra" transactions
    test('minimum charge transactions are mapped correctly', async () => {
      cmResponse.billRun.customers[0].summaryByFinancialYear[1].transactions.push(cmMinimumChargeTransaction);
      updatedBatch = await chargeModuleDecorators.decorateBatch(batch, cmResponse);

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
});
