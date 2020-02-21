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

const Company = require('../../../../src/lib/models/company');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');

const newRepos = require('../../../../src/lib/connectors/repos');
const chargeModuleBatchConnector = require('../../../../src/lib/connectors/charge-module/batches');
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

const REGION_ID = '00000000-0000-0000-0000-000000000001';
const REGION_NAME = 'Anglian';
const CHARGE_REGION_ID = 'A';

const LICENCE_ID = '00000000-0000-0000-0000-000000000002';

const createBatchData = () => ({
  batchId: BATCH_ID,
  region: {
    chargeRegionId: 'A'
  },
  billingInvoices: [{
    invoiceAccountId: INVOICE_1_ACCOUNT_ID,
    invoiceAccountNumber: INVOICE_1_ACCOUNT_NUMBER,
    billingInvoiceLicences: [{
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '01/123/ABC',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      }
    }, {
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '02/345',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      }
    }]
  }, {
    invoiceAccountId: INVOICE_2_ACCOUNT_ID,
    invoiceAccountNumber: INVOICE_2_ACCOUNT_NUMBER,
    billingInvoiceLicences: [{
      licence: {
        licenceId: LICENCE_ID,
        licenceRef: '04/563',
        regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
        region: {
          regionId: REGION_ID,
          name: REGION_NAME,
          chargeRegionId: CHARGE_REGION_ID
        }
      }
    }]
  }]
});

const createChargeModuleData = () => ({
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
          netTotal: 12345
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
          netTotal: 120033
        },
        {
          financialYear: 2020,
          creditLineCount: 3,
          creditLineValue: -15324,
          debitLineCount: 4,
          debitLineValue: 234,
          netTotal: -15090
        }
      ]
    }
  ]
});

experiment('modules/billing/services/invoiceService', () => {
  let batch, chargeModuleData;

  beforeEach(async () => {
    batch = createBatchData();
    chargeModuleData = createChargeModuleData();
    sandbox.stub(newRepos.billingBatches, 'findOneWithInvoices').resolves(batch);
    sandbox.stub(chargeModuleBatchConnector, 'send').resolves(chargeModuleData);

    // Stub CRM invoice account data
    invoiceAccount1 = new InvoiceAccount(INVOICE_1_ACCOUNT_ID);
    invoiceAccount1.company = new Company(COMPANY_1_ID);
    invoiceAccount1.company.name = 'Test Company 1';
    invoiceAccount1.accountNumber = INVOICE_1_ACCOUNT_NUMBER;

    invoiceAccount2 = new InvoiceAccount(INVOICE_2_ACCOUNT_ID);
    invoiceAccount2.company = new Company(COMPANY_2_ID);
    invoiceAccount2.company.name = 'Test Company 2';
    invoiceAccount2.accountNumber = INVOICE_2_ACCOUNT_NUMBER;

    sandbox.stub(invoiceAccountsService, 'getByInvoiceAccountIds').resolves([
      invoiceAccount1, invoiceAccount2
    ]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInvoicesForBatch', () => {
    let invoices;

    beforeEach(async () => {
      invoices = await invoiceService.getInvoicesForBatch(BATCH_ID);
    });

    test('gets batch with correct ID', async () => {
      expect(
        newRepos.billingBatches.findOneWithInvoices.calledWith(BATCH_ID)
      ).to.be.true();
    });

    test('gets draft batch summary data from charge module with correct region and batch ID', async () => {
      const [region, batchId, isDraft] = chargeModuleBatchConnector.send.lastCall.args;
      expect(region).to.equal(batch.region.chargeRegionId);
      expect(batchId).to.equal(BATCH_ID);
      expect(isDraft).to.be.true();
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
});
