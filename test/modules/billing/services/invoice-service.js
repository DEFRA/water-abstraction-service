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
const uuid = require('uuid/v4');

const Address = require('../../../../src/lib/models/address');
const Batch = require('../../../../src/lib/models/batch');
const Company = require('../../../../src/lib/models/company');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const Invoice = require('../../../../src/lib/models/invoice');
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants');

const { NotFoundError } = require('../../../../src/lib/errors');

const mappers = require('../../../../src/modules/billing/mappers');
const repos = require('../../../../src/lib/connectors/repos');
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs');
const invoiceService = require('../../../../src/modules/billing/services/invoice-service');
const invoiceAccountsService = require('../../../../src/modules/billing/services/invoice-accounts-service');

const INVOICE_1_ACCOUNT_ID = uuid();
const INVOICE_1_ACCOUNT_NUMBER = 'A11111111A';
const INVOICE_2_ACCOUNT_ID = uuid();
const INVOICE_2_ACCOUNT_NUMBER = 'A22222222A';
const COMPANY_1_ID = uuid();
const COMPANY_2_ID = uuid();

let invoiceAccount1;
let invoiceAccount2;

const BATCH_ID = '00000000-0000-0000-0000-000000000000';
const EXTERNAL_ID = '00000000-0000-0000-0000-000000000004';

const REGION_ID = '00000000-0000-0000-0000-000000000001';
const REGION_NAME = 'Anglian';
const CHARGE_REGION_ID = 'A';

const LICENCE_ID = '00000000-0000-0000-0000-000000000002';

const createBatch = () => {
  const batch = new Batch(BATCH_ID);
  return batch.fromHash({
    externalId: EXTERNAL_ID
  });
};

const createBatchData = () => ({
  batchId: BATCH_ID,
  region: {
    chargeRegionId: 'A'
  },
  billingInvoices: [{
    invoiceAccountId: INVOICE_1_ACCOUNT_ID,
    invoiceAccountNumber: INVOICE_1_ACCOUNT_NUMBER,
    billingInvoiceLicences: [{
      billingInvoiceId: uuid(),
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '01/123/ABC',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          displayName: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      }
    }, {
      billingInvoiceId: uuid(),
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '02/345',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          displayName: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      }
    }]
  }, {
    invoiceAccountId: INVOICE_2_ACCOUNT_ID,
    invoiceAccountNumber: INVOICE_2_ACCOUNT_NUMBER,
    billingInvoiceLicences: [{
      billingInvoiceId: uuid(),
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '04/563',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          displayName: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      }
    }]
  }]
});

const createChargeModuleData = () => ({
  billRun: {
    customers: [
      {
        customerReference: INVOICE_1_ACCOUNT_NUMBER,
        summaryByFinancialYear: [
          {
            financialYear: 2019,
            creditLineCount: 0,
            creditLineValue: 0,
            debitLineCount: 5,
            debitLineValue: 12345,
            netTotal: 12345,
            transactions: [{
              id: CHARGE_MODULE_TRANSACTION_ID,
              chargeValue: 2345
            }]
          }
        ]
      },
      {
        customerReference: INVOICE_2_ACCOUNT_NUMBER,
        summaryByFinancialYear: [
          {
            financialYear: 2019,
            creditLineCount: 0,
            creditLineValue: 0,
            debitLineCount: 6,
            debitLineValue: 120033,
            netTotal: 120033,
            transactions: []
          },
          {
            financialYear: 2020,
            creditLineCount: 3,
            creditLineValue: -15324,
            debitLineCount: 4,
            debitLineValue: 234,
            netTotal: -15090,
            transactions: []
          }
        ]
      }
    ],
    summary: {
      creditNoteCount: 0,
      creditNoteValue: 0,
      invoiceCount: 1,
      invoiceValue: 2003,
      creditLineCount: 0,
      creditLineValue: 0,
      debitLineCount: 2,
      debitLineValue: 2003,
      netTotal: 2003
    }
  }
});

const CHARGE_MODULE_TRANSACTION_ID = '00000000-0000-0000-0000-000000000006';

const createInvoiceData = () => ({
  billingBatch: {
    billingBatchId: BATCH_ID
  },
  invoiceAccountId: INVOICE_1_ACCOUNT_ID,
  invoiceAccountNumber: INVOICE_1_ACCOUNT_NUMBER,
  billingInvoiceLicences: [{
    billingInvoiceId: uuid(),
    licence: {
      licenceId: LICENCE_ID,
      licenceRef: '01/123/ABC',
      regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
      region: {
        regionId: REGION_ID,
        name: REGION_NAME,
        displayName: REGION_NAME,
        chargeRegionId: CHARGE_REGION_ID
      }
    },
    billingTransactions: [{
      billingTransactionId: uuid(),
      volume: 10.6,
      chargeElement: {
        chargeElementId: uuid(),
        source: 'supported',
        season: CHARGE_SEASON.summer,
        loss: 'high'
      },
      externalId: CHARGE_MODULE_TRANSACTION_ID
    }]
  }]
});

const createOneWithInvoicesWithTransactions = () => ({
  batchId: BATCH_ID,
  region: {
    chargeRegionId: 'A'
  },
  billingInvoices: [{
    invoiceAccountId: INVOICE_1_ACCOUNT_ID,
    invoiceAccountNumber: INVOICE_1_ACCOUNT_NUMBER,
    billingInvoiceLicences: [{
      billingInvoiceId: uuid(),
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '01/123/ABC',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          displayName: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      },
      billingTransactions: [{
        billingTransactionId: uuid(),
        volume: 10.6,
        chargeElement: {
          chargeElementId: uuid(),
          source: 'supported',
          season: CHARGE_SEASON.summer,
          loss: 'high'
        },
        externalId: CHARGE_MODULE_TRANSACTION_ID
      }]
    }]
  },
  {
    invoiceAccountId: INVOICE_2_ACCOUNT_ID,
    invoiceAccountNumber: INVOICE_2_ACCOUNT_NUMBER,
    billingInvoiceLicences: [{
      billingInvoiceId: uuid(),
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '01/123/ABC',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          displayName: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      }
    }, {
      billingInvoiceId: uuid(),
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '02/345',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          displayName: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      }
    }]
  }]
});

experiment('modules/billing/services/invoiceService', () => {
  let batch, batchData, chargeModuleData;

  beforeEach(async () => {
    batch = createBatch();
    batchData = createBatchData();
    chargeModuleData = createChargeModuleData();
    sandbox.stub(repos.billingBatches, 'findOneWithInvoices').resolves(batchData);
    sandbox.stub(chargeModuleBillRunConnector, 'get').resolves(chargeModuleData);
    sandbox.stub(chargeModuleBillRunConnector, 'getCustomer').resolves(chargeModuleData);

    sandbox.stub(repos.billingInvoices, 'findOne').resolves();
    sandbox.stub(repos.billingInvoices, 'upsert').resolves();

    // Stub CRM invoice account data
    invoiceAccount1 = new InvoiceAccount(INVOICE_1_ACCOUNT_ID);
    invoiceAccount1.company = new Company(COMPANY_1_ID);
    invoiceAccount1.company.name = 'Test Company 1';
    invoiceAccount1.accountNumber = INVOICE_1_ACCOUNT_NUMBER;
    invoiceAccount1.address = new Address();
    invoiceAccount1.address.addressLine1 = 'Daisy Cottage';

    invoiceAccount2 = new InvoiceAccount(INVOICE_2_ACCOUNT_ID);
    invoiceAccount2.company = new Company(COMPANY_2_ID);
    invoiceAccount2.company.name = 'Test Company 2';
    invoiceAccount2.accountNumber = INVOICE_2_ACCOUNT_NUMBER;

    sandbox.stub(invoiceAccountsService, 'getByInvoiceAccountIds').resolves([
      invoiceAccount1, invoiceAccount2
    ]);

    sandbox.stub(repos.billingInvoiceLicences, 'findOne');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInvoicesForBatch', () => {
    let invoices;

    beforeEach(async () => {
      invoices = await invoiceService.getInvoicesForBatch(batch);
    });

    test('gets batch with correct ID', async () => {
      expect(
        repos.billingBatches.findOneWithInvoices.calledWith(BATCH_ID)
      ).to.be.true();
    });

    test('gets batch summary data from charge module with correct external ID', async () => {
      const [externalId] = chargeModuleBillRunConnector.get.lastCall.args;
      expect(externalId).to.equal(EXTERNAL_ID);
    });

    test('there is an invoice for each customer', async () => {
      expect(invoices.length).to.equal(2);
      expect(invoices[0].invoiceAccount.accountNumber).to.equal(INVOICE_1_ACCOUNT_NUMBER);
      expect(invoices[1].invoiceAccount.accountNumber).to.equal(INVOICE_2_ACCOUNT_NUMBER);
    });

    test('the invoices have been decorated with the company', async () => {
      expect(invoices[0].invoiceAccount.company.id).to.equal(COMPANY_1_ID);
      expect(invoices[1].invoiceAccount.company.id).to.equal(COMPANY_2_ID);
    });

    test('the first invoice has a correct financial summary', async () => {
      const { totals } = invoices[0];

      expect(totals.creditLineCount).to.equal(0);
      expect(totals.creditLineValue).to.equal(0);
      expect(totals.debitLineCount).to.equal(5);
      expect(totals.debitLineValue).to.equal(12345);
      expect(totals.netTotal).to.equal(12345);
    });

    test('the first invoice has a correct financial summary - totals are summed across financial years', async () => {
      const { totals } = invoices[1];

      expect(totals.creditLineCount).to.equal(3);
      expect(totals.creditLineValue).to.equal(-15324);
      expect(totals.debitLineCount).to.equal(10);
      expect(totals.debitLineValue).to.equal(120267);
      expect(totals.netTotal).to.equal(104943);
    });
  });

  experiment('.getInvoicesTransactionsForBatch', () => {
    let invoices;
    const batchData = createOneWithInvoicesWithTransactions();

    beforeEach(async () => {
      sandbox.stub(repos.billingBatches, 'findOneWithInvoicesWithTransactions').resolves(batchData);
      invoices = await invoiceService.getInvoicesTransactionsForBatch(batch);
    });

    test('gets batch with correct ID', async () => {
      expect(
        repos.billingBatches.findOneWithInvoicesWithTransactions.calledWith(BATCH_ID)
      ).to.be.true();
    });

    test('gets summary data from charge module with correct external ID', async () => {
      expect(
        chargeModuleBillRunConnector.get.calledWith(EXTERNAL_ID)
      ).to.be.true();
    });

    test('there is an invoice for each customer', async () => {
      expect(invoices.length).to.equal(2);
      expect(invoices[0].invoiceAccount.accountNumber).to.equal(INVOICE_1_ACCOUNT_NUMBER);
      expect(invoices[1].invoiceAccount.accountNumber).to.equal(INVOICE_2_ACCOUNT_NUMBER);
    });

    test('the invoices have been decorated with the company', async () => {
      expect(invoices[0].invoiceAccount.company.id).to.equal(COMPANY_1_ID);
      expect(invoices[1].invoiceAccount.company.id).to.equal(COMPANY_2_ID);
    });

    test('the transaction is decorated with the value from the charge module', async () => {
      expect(invoices[0].invoiceLicences[0].transactions[0].value).to.equal(2345);
    });
  });

  experiment('.getInvoiceForBatch', () => {
    let result;
    const INVOICE_ID = '00000000-0000-0000-0000-000000000005';

    experiment('when invoice not found in repo', () => {
      beforeEach(async () => {
        repos.billingInvoices.findOne.resolves(null);
        result = await invoiceService.getInvoiceForBatch(BATCH_ID, INVOICE_ID);
      });

      test('null is returned', async () => {
        expect(result).to.equal(null);
      });
    });

    experiment('when invoice found, but batch ID does not match that requested', () => {
      beforeEach(async () => {
        repos.billingInvoices.findOne.resolves({
          billingBatch: {
            billingBatchId: 'wrong-id'
          }
        });
        result = await invoiceService.getInvoiceForBatch(BATCH_ID, INVOICE_ID);
      });

      test('null is returned', async () => {
        expect(result).to.equal(null);
      });
    });

    experiment('when invoice is found and batch ID does match that requested', () => {
      let invoice;

      beforeEach(async () => {
        invoice = createInvoiceData();
        repos.billingInvoices.findOne.resolves(invoice);
        result = await invoiceService.getInvoiceForBatch(batch, INVOICE_ID);
      });

      test('the invoice repo .findOne() method is called with the correct invoice ID', async () => {
        expect(repos.billingInvoices.findOne.calledWith(
          INVOICE_ID
        )).to.be.true();
      });

      test('returns an Invoice instance', async () => {
        expect(result instanceof Invoice).to.be.true();
      });

      test('the invoice is decorated with totals from the charge module', async () => {
        const summary = chargeModuleData.billRun.customers[0].summaryByFinancialYear[0];
        expect(result.totals.creditLineCount).to.equal(summary.creditLineCount);
        expect(result.totals.creditLineValue).to.equal(summary.creditLineValue);
        expect(result.totals.debitLineCount).to.equal(summary.debitLineCount);
        expect(result.totals.debitLineValue).to.equal(summary.debitLineValue);
        expect(result.totals.netTotal).to.equal(summary.netTotal);
      });

      test('the invoice is decorated with invoice account company/address data from the CRM', async () => {
        expect(result.invoiceAccount).to.equal(invoiceAccount1);
      });

      test('the transaction is decorated with the value from the charge module', async () => {
        expect(result.invoiceLicences[0].transactions[0].value).to.equal(2345);
      });
    });
  });

  experiment('.saveInvoiceToDB', () => {
    const batch = new Batch();
    const invoice = new Invoice();

    beforeEach(async () => {
      sandbox.stub(mappers.invoice, 'modelToDb').returns({ foo: 'bar' });
      await invoiceService.saveInvoiceToDB(batch, invoice);
    });

    test('calls the relevant mapper with the batch and invoice', async () => {
      expect(mappers.invoice.modelToDb.calledWith(batch, invoice)).to.be.true();
    });

    test('calls .upsert() on the repo with the result of the mapping', async () => {
      expect(repos.billingInvoices.upsert.calledWith({ foo: 'bar' })).to.be.true();
    });
  });

  experiment('.getInvoiceByInvoiceLicenceId', () => {
    const invoiceLicenceId = uuid();
    let result;

    experiment('when the invoiceLicence is not found', () => {
      beforeEach(async () => {
        repos.billingInvoiceLicences.findOne.resolves(null);
      });

      test('rejects with a NotFoundError', async () => {
        const func = () => invoiceService.getInvoiceByInvoiceLicenceId(invoiceLicenceId);
        const err = await expect(func()).to.reject();
        expect(err instanceof NotFoundError).to.be.true();
      });
    });

    experiment('when the invoiceLicence is found', () => {
      const data = {

        billingInvoice: {
          id: uuid(),
          invoiceAccountId: INVOICE_1_ACCOUNT_ID,
          invoiceAccountNumber: INVOICE_1_ACCOUNT_NUMBER
        }
      };

      beforeEach(async () => {
        repos.billingInvoiceLicences.findOne.resolves(data);
        result = await invoiceService.getInvoiceByInvoiceLicenceId(invoiceLicenceId);
      });

      test('the repo method is called with the correct ID', async () => {
        expect(repos.billingInvoiceLicences.findOne.calledWith(
          invoiceLicenceId
        )).to.be.true();
      });

      test('the correct invoice account is requested from the CRM', async () => {
        expect(invoiceAccountsService.getByInvoiceAccountIds.calledWith(
          [data.billingInvoice.invoiceAccountId]
        )).to.be.true();
      });

      test('resolves with an Invoice model', async () => {
        expect(result instanceof Invoice).to.be.true();
      });

      test('resolves with the invoice account data from the CRM', async () => {
        expect(result.invoiceAccount.accountNumber).to.equal(INVOICE_1_ACCOUNT_NUMBER);
      });
    });
  });
});
