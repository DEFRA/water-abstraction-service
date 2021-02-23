'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

// Services
const cmBillRunsConnector = require('../../../../src/lib/connectors/charge-module/bill-runs');
const cmRefreshService = require('../../../../src/modules/billing/services/cm-refresh-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const invoiceService = require('../../../../src/modules/billing/services/invoice-service');
const transactionService = require('../../../../src/modules/billing/services/transactions-service');

// Models
const Batch = require('../../../../src/lib/models/batch');
const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const Transaction = require('../../../../src/lib/models/transaction');

const batchId = uuid();
const externalId = uuid();
const transactionIds = [
  uuid(), uuid(), uuid()
];
const customerRefs = [
  'A00000000A', 'A00000001A'
];
const licenceNumbers = [
  '01/234/ABC', '04/567/CDE'
];
const financialYearEnding = 2021;
const invoiceNumbers = [
  'A1234', 'B4567'
];
const minChargeDescription = 'Minimum Charge Calculation - raised under Schedule 23 of the Environment Act 1995';
const minChargeValue = 2044;
const deletedTransactionIds = [
  uuid(), uuid()
];

const createBatch = () => new Batch().fromHash({
  id: batchId,
  externalId
});

const cmResponses = {
  batchSummary: {
    generating: {
      billRun: {
        status: 'generating_summary'
      }
    },
    ready: {
      billRun: {
        id: externalId,
        billRunNumber: 1234,
        region: 'N',
        status: 'initialised',
        approvedForBilling: false,
        preSroc: true,
        summary: {
          creditNoteCount: 2,
          creditNoteValue: -27917,
          invoiceCount: 1,
          invoiceValue: 1864134,
          creditLineCount: 4,
          creditLineValue: -42254,
          debitLineCount: 3,
          debitLineValue: 1878471,
          zeroValueLineCount: 7,
          netTotal: 1836217
        },
        customers: [
          {
            customerReference: customerRefs[0],
            summaryByFinancialYear: [
              {
                financialYear: financialYearEnding - 1,
                creditLineCount: 2,
                creditLineValue: -21127,
                debitLineCount: 1,
                debitLineValue: 11274,
                zeroValueLineCount: 3,
                netTotal: -9853,
                deminimis: false,
                netZeroValueInvoice: false
              }
            ]
          },
          {
            customerReference: customerRefs[1],
            summaryByFinancialYear: [
              {
                financialYear: financialYearEnding - 1,
                creditLineCount: 2,
                creditLineValue: -21127,
                debitLineCount: 1,
                debitLineValue: 3063,
                zeroValueLineCount: 3,
                netTotal: -18064,
                deminimis: false,
                netZeroValueInvoice: false
              }
            ]
          }
        ]
      }
    }
  },
  batchTransactions: {
    [customerRefs[0]]: {
      pagination: {
        page: 1,
        perPage: 50,
        pageCount: 1,
        recordCount: 1
      },
      data: {
        transactions: [{
          id: transactionIds[0],
          deminimis: false,
          chargeValue: 123,
          transactionReference: invoiceNumbers[0],
          licenceNumber: licenceNumbers[0]
        }]
      }
    },
    [customerRefs[1]]: {
      pagination: {
        page: 1,
        perPage: 50,
        pageCount: 1,
        recordCount: 1
      },
      data: {
        transactions: [{
          id: transactionIds[1],
          deminimis: false,
          chargeValue: 456,
          transactionReference: invoiceNumbers[1],
          licenceNumber: licenceNumbers[1]
        }, {
          id: transactionIds[2],
          deminimis: false,
          chargeValue: minChargeValue,
          minimumChargeAdjustment: true,
          transactionReference: invoiceNumbers[1],
          licenceNumber: licenceNumbers[1],
          lineDescription: minChargeDescription
        }]
      }
    }
  }
};

const createInvoices = () => customerRefs.map((accountNumber, i) => {
  return new Invoice().fromHash({
    invoiceAccount: new InvoiceAccount().fromHash({
      accountNumber
    }),
    financialYear: new FinancialYear(financialYearEnding),
    invoiceLicences: [
      new InvoiceLicence().fromHash({
        licence: new Licence().fromHash({
          licenceNumber: licenceNumbers[i]
        }),
        transactions: [
          new Transaction().fromHash({
            id: deletedTransactionIds[i],
            externalId: uuid()
          })
        ]
      })
    ]
  });
});

experiment('modules/billing/services/cm-refresh-service', () => {
  let result, batch, invoices;

  beforeEach(async () => {
    sandbox.stub(batchService, 'getBatchById');
    sandbox.stub(batchService, 'updateWithCMSummary');

    sandbox.stub(cmBillRunsConnector, 'get');
    sandbox.stub(cmBillRunsConnector, 'getInvoiceTransactions');

    sandbox.stub(invoiceService, 'getInvoicesForBatch');
    sandbox.stub(invoiceService, 'saveInvoiceToDB');

    sandbox.stub(transactionService, 'saveTransactionToDB');
    sandbox.stub(transactionService, 'deleteById');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('updateBatch', () => {
    experiment('when the batch is not found', async () => {
      beforeEach(async () => {
        batchService.getBatchById.resolves(null);
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => cmRefreshService.updateBatch(batchId);
        const err = await expect(func()).to.reject();
        expect(err.name).to.equal('NotFoundError');
      });
    });

    experiment('when the CM batch status is "generating_summary"', () => {
      beforeEach(async () => {
        batch = createBatch();
        batchService.getBatchById.resolves(batch);
        cmBillRunsConnector.get.resolves(cmResponses.batchSummary.generating);
        result = await cmRefreshService.updateBatch(batchId);
      });

      test('the correct batch is retrieved from the batch service', async () => {
        expect(batchService.getBatchById.calledWith(batchId)).to.be.true();
      });

      test('the batch is fetched from the CM on externalId', async () => {
        expect(cmBillRunsConnector.get.calledWith(externalId)).to.be.true();
      });

      test('returns false', async () => {
        expect(result).to.equal(false);
      });
    });

    experiment('when the CM batch is ready', () => {
      beforeEach(async () => {
        batch = createBatch();
        invoices = createInvoices();

        batchService.getBatchById.resolves(batch);
        batchService.updateWithCMSummary.resolves(batch);

        invoiceService.getInvoicesForBatch.resolves(invoices);

        cmBillRunsConnector.get.resolves(cmResponses.batchSummary.ready);
        cmBillRunsConnector.getInvoiceTransactions.withArgs(externalId, customerRefs[0], financialYearEnding - 1, 1).resolves(cmResponses.batchTransactions[customerRefs[0]]);
        cmBillRunsConnector.getInvoiceTransactions.withArgs(externalId, customerRefs[1], financialYearEnding - 1, 1).resolves(cmResponses.batchTransactions[customerRefs[1]]);

        result = await cmRefreshService.updateBatch(batchId);
      });

      test('the correct batch is retrieved from the batch service', async () => {
        expect(batchService.getBatchById.calledWith(batchId)).to.be.true();
      });

      test('the batch is fetched from the CM on externalId', async () => {
        expect(cmBillRunsConnector.get.calledWith(externalId)).to.be.true();
      });

      test('invoices are fetched for the batch from the db', async () => {
        expect(invoiceService.getInvoicesForBatch.calledWith(
          batch, { includeTransactions: true }
        )).to.be.true();
      });

      test('transactions are fetched from the CM for each invoice', async () => {
        expect(cmBillRunsConnector.getInvoiceTransactions.callCount).to.equal(2);
        expect(cmBillRunsConnector.getInvoiceTransactions.calledWith(
          externalId, customerRefs[0], financialYearEnding - 1, 1
        )).to.be.true();
        expect(cmBillRunsConnector.getInvoiceTransactions.calledWith(
          externalId, customerRefs[1], financialYearEnding - 1, 1
        )).to.be.true();
      });

      test('the transactions are persisted', async () => {
        expect(transactionService.saveTransactionToDB.callCount).to.equal(3);
      });

      test('the minimum charge transaction is persisted', async () => {
        const [invoiceLicence, transaction] = transactionService.saveTransactionToDB.lastCall.args;
        expect(invoiceLicence.licence.licenceNumber).to.equal(licenceNumbers[1]);
        expect(transaction.isMinimumCharge).to.be.true();
        expect(transaction.description).to.equal(minChargeDescription);
        expect(transaction.value).to.equal(minChargeValue);
      });

      test('local transactions no longer in the CM batch are deleted', async () => {
        expect(transactionService.deleteById.callCount).to.equal(2);
        expect(transactionService.deleteById.calledWith(
          [deletedTransactionIds[0]]
        )).to.be.true();
        expect(transactionService.deleteById.calledWith(
          [deletedTransactionIds[1]]
        )).to.be.true();
      });
    });
  });
});
