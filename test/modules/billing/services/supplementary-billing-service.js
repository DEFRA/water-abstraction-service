'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { Batch } = require('../../../../src/lib/models');
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const crmV2Connector = require('../../../../src/lib/connectors/crm-v2');
const newRepos = require('../../../../src/lib/connectors/repos');

const supplementaryBillingService = require('../../../../src/modules/billing/services/supplementary-billing-service');

const batchId = '398b6f31-ff01-4621-b939-e720f1a77deb';
const invoiceAccountId = '398b6f31-ff01-4621-b939-e720f1a77deb';

const createTransactionRow = (index, transactionKey, isCredit = false) => ({
  billingTransactionId: `00000000-0000-0000-0000-00000000000${index}`,
  isCredit,
  transactionKey
});

const createFullTransaction = (...args) => ({
  ...createTransactionRow(...args),
  volume: 25.2,
  description: 'Babbling brook',
  chargeElement: {
    chargeElementId: '0b76bf54-57f4-428e-8fc8-3494c84affc6',
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high'
  },
  billingInvoiceLicence: {
    billingInvoice: {
      invoiceAccountId
    },
    licence: {
      licenceId: '4b4f2427-984e-48f6-8b20-f17380b870a8',
      licenceRef: '01/123/ABC',
      regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
      region: {
        regionId: '74241f84-de5f-4ec5-b437-377af15289fd',
        name: 'Anglian',
        displayName: 'Anglian',
        naldRegionId: 1,
        chargeRegionId: 'A'
      }
    }
  }
});

const data = {
  batchId,
  batchTransactions: [
    createTransactionRow(0, '0000000000000000000000000000000A'),
    createTransactionRow(1, '0000000000000000000000000000000B'),
    createTransactionRow(2, '0000000000000000000000000000000C')
  ],
  historicalTransactions: [
    createTransactionRow(3, '0000000000000000000000000000000B'),
    createTransactionRow(4, '0000000000000000000000000000000C', true),
    createTransactionRow(5, '0000000000000000000000000000000D'),
    createTransactionRow(6, '0000000000000000000000000000000E', true)
  ],
  creditTransactions: [
    createFullTransaction(5, '0000000000000000000000000000000D')
  ],
  crmResponse: [{
    invoiceAccountId,
    invoiceAccountNumber: 'A12345678A',
    company: {
      companyId: 'c3fea19d-f5da-4293-bf31-38d7b79d5bf5',
      name: 'A test co'
    },
    address: {
      addressId: '3b0c8648-e6c0-41a4-aae0-4e1b5b8f7a3a',
      address1: 'Daisy cottage',
      address2: 'Long and winding road',
      address3: null,
      address4: null,
      town: 'Testington',
      county: 'Testingshire',
      postcode: 'TT1 1TT'
    }
  }],
  models: {
    batch: new Batch(batchId)
  }
};

experiment('modules/billing/services/supplementary-billing-service', () => {
  beforeEach(async () => {
    sandbox.stub(crmV2Connector.invoiceAccounts, 'getInvoiceAccountsByIds');
    sandbox.stub(batchService, 'getBatchById');
    sandbox.stub(batchService, 'saveInvoicesToDB');
    sandbox.stub(newRepos.billingInvoiceLicences, 'deleteEmptyByBatchId');
    sandbox.stub(newRepos.billingInvoices, 'deleteEmptyByBatchId');
    sandbox.stub(newRepos.billingTransactions, 'find');
    sandbox.stub(newRepos.billingTransactions, 'findByBatchId');
    sandbox.stub(newRepos.billingTransactions, 'findHistoryByBatchId');
    sandbox.stub(newRepos.billingTransactions, 'delete');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.processBatch', () => {
    beforeEach(async () => {
      newRepos.billingTransactions.findByBatchId.resolves(data.batchTransactions);
      newRepos.billingTransactions.findHistoryByBatchId.resolves(data.historicalTransactions);
      newRepos.billingTransactions.find.resolves(data.creditTransactions);
      crmV2Connector.invoiceAccounts.getInvoiceAccountsByIds.resolves(data.crmResponse);
      batchService.getBatchById.resolves(
        data.models.batch
      );
      await supplementaryBillingService.processBatch(data.batchId);
    });

    test('calls billingTransactions.findByBatchId with correct batch ID', async () => {
      expect(newRepos.billingTransactions.findByBatchId.calledWith(
        data.batchId
      )).to.be.true();
    });

    test('calls billingTransactions.findHistoryByBatchId with correct batch ID', async () => {
      expect(newRepos.billingTransactions.findHistoryByBatchId.calledWith(
        data.batchId
      )).to.be.true();
    });

    test('current batch transactions which have already been charged are deleted', async () => {
      expect(newRepos.billingTransactions.delete.calledWith(
        ['00000000-0000-0000-0000-000000000001']
      )).to.be.true();
    });

    experiment('historical charges which have no charge in the current batch', () => {
      test('are fetched from the repo', async () => {
        expect(newRepos.billingTransactions.find.calledWith(
          ['00000000-0000-0000-0000-000000000005']
        )).to.be.true();
      });

      test('have their invoice account fetched from the CRM', async () => {
        expect(crmV2Connector.invoiceAccounts.getInvoiceAccountsByIds.calledWith(
          [data.creditTransactions[0].billingInvoiceLicence.billingInvoice.invoiceAccountId]
        )).to.be.true();
      });

      experiment('persist the batch', () => {
        let batch;

        beforeEach(async () => {
          batch = batchService.saveInvoicesToDB.lastCall.args[0];
        });

        test('to the correct batch', async () => {
          expect(batch.id).to.equal(batchId);
        });

        test('only the correct number of transactions are credited', async () => {
          expect(batch.invoices).to.have.length(1);
          expect(batch.invoices[0].invoiceLicences).to.have.length(1);
          expect(batch.invoices[0].invoiceLicences[0].transactions).to.have.length(1);
        });

        test('the invoice details are correctly loaded from the CRM', async () => {
          expect(batch.invoices[0].invoiceAccount.id).to.equal(data.crmResponse[0].invoiceAccountId);
          expect(batch.invoices[0].invoiceAccount.accountNumber).to.equal(data.crmResponse[0].invoiceAccountNumber);
          expect(batch.invoices[0].invoiceAccount.company.id).to.equal(data.crmResponse[0].company.companyId);
          expect(batch.invoices[0].address.id).to.equal(data.crmResponse[0].address.addressId);
        });

        test('the licence details are taken from the historical transaction', async () => {
          const [invoiceAccountLicence] = batch.invoices[0].invoiceLicences;
          expect(invoiceAccountLicence.licence.id).to.equal(data.creditTransactions[0].billingInvoiceLicence.licence.licenceId);
          expect(invoiceAccountLicence.licence.licenceNumber).to.equal(data.creditTransactions[0].billingInvoiceLicence.licence.licenceRef);
        });

        test('the new credit transaction has the correct details', async () => {
          const [transaction] = batch.invoices[0].invoiceLicences[0].transactions;
          expect(transaction.id).to.be.undefined();
          expect(transaction.isCredit).to.be.true();
          expect(transaction.status).to.equal('candidate');
          expect(transaction.description).to.equal(data.creditTransactions[0].description);
          expect(transaction.chargeElement.id).to.equal(data.creditTransactions[0].chargeElement.chargeElementId);
        });
      });
    });

    test('empty billing records are removed from the DB', async () => {
      expect(
        newRepos.billingInvoiceLicences.deleteEmptyByBatchId.calledWith(batchId)
      ).to.be.true();
      expect(
        newRepos.billingInvoices.deleteEmptyByBatchId.calledWith(batchId)
      ).to.be.true();
    });
  });
});
