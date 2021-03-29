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

const customerRefs = [
  'A00000000A', 'A00000001A'
];
const licenceNumbers = [
  '01/234/ABC', '04/567/CDE'
];
const invoiceIds = [
  uuid(), uuid()
];
const financialYearEnding = 2021;
const invoiceNumbers = [
  'A1234', 'B4567'
];

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
        status: 'generating',
        invoices: []
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
        invoices: [
          {
            id: invoiceIds[0],
            customerReference: customerRefs[0],
            financialYear: financialYearEnding - 1,
            creditLineCount: 1,
            creditLineValue: 21127,
            debitLineCount: 1,
            debitLineValue: 11274,
            zeroLineCount: 0,
            deminimisInvoice: false,
            zeroValueInvoice: false,
            transactionReference: invoiceNumbers[0],
            licences: [
              {
                id: uuid(),
                licenceNumber: licenceNumbers[0],
                transactions: [{
                  value: 21127,
                  isCredit: true,
                  licenceNumber: licenceNumbers[0],
                  transactionReference: invoiceNumbers[0]
                },
                {
                  value: 11274,
                  licenceNumber: licenceNumbers[0],
                  transactionReference: invoiceNumbers[0]
                }
                ]
              }
            ],
            netTotal: -9853
          },
          {
            id: invoiceIds[1],
            customerReference: customerRefs[1],
            financialYear: financialYearEnding - 1,
            creditLineCount: 2,
            creditLineValue: 21127,
            debitLineCount: 1,
            debitLineValue: 3063,
            zeroLineCount: 1,
            deminimisInvoice: false,
            zeroValueInvoice: false,
            transactionReference: invoiceNumbers[1],
            licences: [
              {
                id: uuid(),
                licenceNumber: licenceNumbers[1],
                transactions: [{
                  value: 10200,
                  isCredit: true,
                  isMinimumCharge: false,
                  minChargeValue: 25,
                  licenceNumber: licenceNumbers[1],
                  transactionReference: invoiceNumbers[1]
                },
                {
                  value: 10927,
                  isCredit: true,
                  isMinimumCharge: false,
                  minChargeValue: 25,
                  licenceNumber: licenceNumbers[1],
                  transactionReference: invoiceNumbers[1]
                },
                {
                  value: 3063,
                  isCredit: false,
                  isMinimumCharge: false,
                  minChargeValue: 25,
                  licenceNumber: licenceNumbers[1],
                  transactionReference: invoiceNumbers[1]
                },
                {
                  value: 1,
                  isCredit: false,
                  isMinimumCharge: true,
                  minChargeValue: 25,
                  licenceNumber: licenceNumbers[1],
                  transactionReference: invoiceNumbers[1]
                }]
              }
            ],
            netTotal: -18064
          }
        ]
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

    experiment('when the CM batch status is "generating"', () => {
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
        cmBillRunsConnector.getInvoiceTransactions.withArgs(externalId, invoiceIds[0]).resolves({
          invoice: cmResponses.batchSummary.ready.billRun.invoices[0]
        });
        cmBillRunsConnector.getInvoiceTransactions.withArgs(externalId, invoiceIds[1]).resolves({
          invoice: cmResponses.batchSummary.ready.billRun.invoices[1]
        });

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
    });
  });
});
