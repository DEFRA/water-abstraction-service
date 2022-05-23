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
const { find } = require('lodash');

const Batch = require('../../../src/lib/models/batch');
const Invoice = require('../../../src/lib/models/invoice');
const { CHARGE_SEASON } = require('../../../src/lib/models/constants');

const mappers = require('../../../src/lib/mappers');
const repos = require('../../../src/lib/connectors/repos');
const invoiceAccountsConnector = require('../../../src/lib/connectors/crm-v2/invoice-accounts');
const chargeModuleBillRunApi = require('../../../src/lib/connectors/charge-module/bill-runs');
const { logger } = require('../../../src/logger');

const invoiceService = require('../../../src/lib/services/invoice-service');

const { NotFoundError, ConflictingDataError } = require('../../../src/lib/errors');

const IDS = {
  batch: uuid(),
  batchExternalId: uuid(),
  invoices: [uuid(), uuid(), uuid()],
  invoiceAccounts: [uuid(), uuid()],
  transactions: [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()],
  accountNumbers: ['A11111111A', 'A22222222A'],
  companies: [uuid(), uuid(), uuid()],
  contacts: [uuid()]
};

const createBatch = () => {
  const batch = new Batch(IDS.batch);
  return batch.fromHash({
    externalId: IDS.batchExternalId,
    status: 'sent'
  });
};

const createTransaction = (externalId, netAmount = 2345) => ({
  billingTransactionId: uuid(),
  volume: 10.6,
  chargeElement: {
    chargeElementId: uuid(),
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high',
    authorisedAnnualQuantity: 12
  },
  billingVolume: [],
  externalId,
  isDeMinimis: false,
  netAmount
});

const createLicence = licenceRef => ({
  licenceId: uuid(),
  licenceRef: '01/123/ABC',
  regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
  region: {
    regionId: '00000000-0000-0000-0000-000000000001',
    name: 'Anglian',
    displayName: 'Anglian',
    chargeRegionId: 'A'
  },
  startDate: '2019-01-01',
  expiredDate: null,
  lapsedDate: null,
  revokedDate: null
});

const createBatchData = () => {
  return {
    batchId: IDS.batch,
    region: {
      chargeRegionId: 'A'
    },
    billingInvoices: [
      // Invoice for customer 1 in 2019
      {
        billingBatchId: IDS.batch,
        billingInvoiceId: IDS.invoices[0],
        invoiceAccountId: IDS.invoiceAccounts[0],
        invoiceAccountNumber: IDS.accountNumbers[0],
        financialYearEnding: 2019,
        netAmount: 12345,
        creditNoteValue: 0,
        invoiceValue: 12345,
        billingInvoiceLicences: [{
          billingInvoiceId: IDS.invoices[0],
          billingInvoiceLicenceId: uuid(),
          licence: createLicence('01/123'),
          billingTransactions: [
            createTransaction(IDS.transactions[0], 2345),
            createTransaction(IDS.transactions[1], 10000)
          ]
        }]
      },
      // Invoice for customer 2 in 2019
      {
        billingBatchId: IDS.batch,
        billingInvoiceId: IDS.invoices[1],
        invoiceAccountId: IDS.invoiceAccounts[1],
        invoiceAccountNumber: IDS.accountNumbers[1],
        financialYearEnding: 2019,
        invoiceValue: 523,
        creditNoteValue: 0,
        netAmount: 523,
        billingInvoiceLicences: [{
          billingInvoiceId: IDS.invoices[1],
          billingInvoiceLicenceId: uuid(),
          licence: createLicence('02/456'),
          billingTransactions: [
            createTransaction(IDS.transactions[2], 400),
            createTransaction(IDS.transactions[3], 123)
          ]
        }]
      },
      // Invoice for customer 1 in 2020
      {
        billingBatchId: IDS.batch,
        billingInvoiceId: IDS.invoices[2],
        invoiceAccountId: IDS.invoiceAccounts[0],
        invoiceAccountNumber: IDS.accountNumbers[0],
        financialYearEnding: 2020,
        invoiceValue: 100,
        creditNoteValue: -200,
        netAmount: -100,
        billingInvoiceLicences: [{
          billingInvoiceId: IDS.invoices[2],
          billingInvoiceLicenceId: uuid(),
          licence: createLicence('01/123'),
          billingTransactions: [
            createTransaction(IDS.transactions[4], 100),
            createTransaction(IDS.transactions[5], -200)
          ]
        }]
      }
    ]
  };
};

const createBatchDataWithoutTransactions = () => {
  const data = createBatchData();
  for (const billingInvoice of data.billingInvoices) {
    for (const billingInvoiceLicence of billingInvoice.billingInvoiceLicences) {
      delete billingInvoiceLicence.billingTransactions;
    }
  }
  return data;
};

const getInvoiceAccountNumber = invoice => invoice.invoiceAccount.accountNumber;
const getInvoiceFinancialYear = invoice => invoice.financialYear.yearEnding;

const findInvoice = (invoices, accountNumber, financialYear) => find(invoices, invoice =>
  getInvoiceAccountNumber(invoice) === accountNumber && getInvoiceFinancialYear(invoice) === financialYear
);

const createAddress = address1 => ({
  addressId: uuid(),
  address1,
  address2: null,
  address3: null,
  address4: null,
  town: 'Testington',
  county: 'Testingshire',
  postcode: 'TT1 1TT',
  country: 'UK',
  dataSource: 'nald'
});

const createCrmData = () => ([
  {
    invoiceAccountId: IDS.invoiceAccounts[0],
    invoiceAccountNumber: IDS.accountNumbers[0],
    company: {
      companyId: IDS.companies[0],
      name: 'Test Company 1'
    },
    invoiceAccountAddresses: [
      {
        invoiceAccountId: IDS.invoiceAccounts[0],
        startDate: '2019-01-01',
        address: createAddress('Daisy cottage'),
        agentCompany: {
          companyId: IDS.companies[1]
        },
        contact: {
          contactId: IDS.contacts[0]
        }
      }
    ]
  },
  {
    invoiceAccountId: IDS.invoiceAccounts[1],
    invoiceAccountNumber: IDS.accountNumbers[1],
    company: {
      companyId: IDS.companies[2],
      name: 'Test Company 2'
    },
    invoiceAccountAddresses: [{
      invoiceAccountId: IDS.invoiceAccounts[1],
      startDate: '2018-01-01',
      address: createAddress('Buttercup farm')
    }]
  }
]);

experiment('modules/billing/services/invoiceService', () => {
  let batch, crmData;

  beforeEach(async () => {
    batch = createBatch();
    crmData = createCrmData();

    sandbox.stub(repos.billingBatches, 'findOneWithInvoices').resolves(createBatchDataWithoutTransactions());
    sandbox.stub(repos.billingBatches, 'findOneWithInvoicesWithTransactions').resolves(createBatchData());

    sandbox.stub(repos.billingInvoices, 'findOne').resolves();
    sandbox.stub(repos.billingInvoices, 'upsert').resolves();
    sandbox.stub(repos.billingInvoices, 'update').resolves();
    sandbox.stub(repos.billingInvoices, 'findOneBy').resolves();
    sandbox.stub(repos.billingInvoices, 'findAllForInvoiceAccount').resolves();
    sandbox.stub(repos.billingInvoices, 'findByIsFlaggedForRebillingAndRegion').resolves();
    sandbox.stub(repos.billingInvoices, 'resetIsFlaggedForRebilling').resolves();
    sandbox.stub(repos.billingInvoices, 'deleteInvoicesByOriginalInvoiceId').resolves();
    sandbox.stub(repos.billingInvoices, 'create');

    sandbox.stub(invoiceAccountsConnector, 'getInvoiceAccountsByIds').resolves(crmData);

    sandbox.stub(repos.billingInvoiceLicences, 'findOne');

    sandbox.stub(mappers.invoice, 'modelToDb');

    sandbox.stub(chargeModuleBillRunApi, 'rebillInvoice');

    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInvoicesForBatch', () => {
    let invoices;

    beforeEach(async () => {
      invoices = await invoiceService.getInvoicesForBatch(batch, {
        includeInvoiceAccounts: true
      });
    });

    test('gets batch with correct ID', async () => {
      expect(
        repos.billingBatches.findOneWithInvoices.calledWith(IDS.batch)
      ).to.be.true();
    });

    test('there is an invoice for each customer and financial year combination', async () => {
      expect(invoices.length).to.equal(3);
    });

    experiment('the 2019 invoice for customer 1', () => {
      let invoice;

      beforeEach(async () => {
        invoice = findInvoice(invoices, IDS.accountNumbers[0], 2019);
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has the correct CRM company, agent and contact', async () => {
        expect(invoice.invoiceAccount.company.id).to.equal(IDS.companies[0]);
        expect(invoice.agentCompany.id).to.equal(IDS.companies[1]);
        expect(invoice.contact.id).to.equal(IDS.contacts[0]);
      });

      test('has a correct financial summary', async () => {
        expect(invoice.creditNoteValue).to.equal(0);
        expect(invoice.invoiceValue).to.equal(12345);
        expect(invoice.netTotal).to.equal(12345);
      });
    });

    experiment('the 2020 invoice for customer 1', () => {
      let invoice;

      beforeEach(async () => {
        invoice = findInvoice(invoices, IDS.accountNumbers[0], 2020);
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has the correct CRM company, agent and contact', async () => {
        expect(invoice.invoiceAccount.company.id).to.equal(IDS.companies[0]);
        expect(invoice.agentCompany.id).to.equal(IDS.companies[1]);
        expect(invoice.contact.id).to.equal(IDS.contacts[0]);
      });

      test('has a correct financial summary', async () => {
        expect(invoice.creditNoteValue).to.equal(-200);
        expect(invoice.invoiceValue).to.equal(100);
        expect(invoice.netTotal).to.equal(-100);
      });
    });

    experiment('the 2019 invoice for customer 2', () => {
      let invoice;

      beforeEach(async () => {
        invoice = findInvoice(invoices, IDS.accountNumbers[1], 2019);
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has the correct CRM company, agent and contact', async () => {
        expect(invoice.invoiceAccount.company.id).to.equal(IDS.companies[2]);
        expect(invoice.agentCompany).to.be.undefined();
        expect(invoice.contact).to.be.undefined();
      });

      test('has a correct financial summary', async () => {
        expect(invoice.creditNoteValue).to.equal(0);
        expect(invoice.invoiceValue).to.equal(523);
        expect(invoice.netTotal).to.equal(523);
      });
    });
  });

  experiment('.getInvoicesForBatchDownload', () => {
    let invoices;

    beforeEach(async () => {
      invoices = await invoiceService.getInvoicesForBatchDownload(batch);
    });

    test('gets batch with correct ID', async () => {
      expect(
        repos.billingBatches.findOneWithInvoicesWithTransactions.calledWith(IDS.batch)
      ).to.be.true();
    });

    test('there is an invoice for each customer and financial year combination', async () => {
      expect(invoices.length).to.equal(3);
    });

    test('has the correct CRM company, agent and contact', async () => {
      expect(invoices[0].invoiceAccount.company.name).to.equal('Test Company 1');
      expect(invoices[0].agentCompany).to.be.undefined();
      expect(invoices[0].contact).to.be.undefined();
    });

    test('has a correct financial summary', async () => {
      expect(invoices[0].creditNoteValue).to.equal(0);
      expect(invoices[0].invoiceValue).to.equal(12345);
      expect(invoices[0].netAmount).to.equal(12345);
    });
  });

  experiment('.getInvoicesTransactionsForBatch', () => {
    let invoices;

    beforeEach(async () => {
      invoices = await invoiceService.getInvoicesTransactionsForBatch(batch, {
        includeInvoiceAccounts: true,
        includeTransactions: true
      });
    });

    test('gets batch with correct ID', async () => {
      expect(
        repos.billingBatches.findOneWithInvoicesWithTransactions.calledWith(IDS.batch)
      ).to.be.true();
    });

    test('there is an invoice for each customer and financial year combination', async () => {
      expect(invoices.length).to.equal(3);
    });

    experiment('the 2019 invoice for customer 1', () => {
      let invoice;

      beforeEach(async () => {
        invoice = findInvoice(invoices, IDS.accountNumbers[0], 2019);
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has the correct CRM company, agent and contact', async () => {
        expect(invoice.invoiceAccount.company.id).to.equal(IDS.companies[0]);
        expect(invoice.agentCompany.id).to.equal(IDS.companies[1]);
        expect(invoice.contact.id).to.equal(IDS.contacts[0]);
      });

      test('has 2 transactions', async () => {
        expect(invoice.invoiceLicences[0].transactions).to.be.an.array().length(2);
      });

      test('has the correct transaction amount for transaction 1', async () => {
        const transaction = find(invoice.invoiceLicences[0].transactions, { externalId: IDS.transactions[0] });
        expect(transaction.value).to.equal(2345);
      });

      test('has the correct transaction amount for transaction 2', async () => {
        const transaction = find(invoice.invoiceLicences[0].transactions, { externalId: IDS.transactions[1] });
        expect(transaction.value).to.equal(10000);
      });

      test(' has a correct financial summary', async () => {
        expect(invoice.creditNoteValue).to.equal(0);
        expect(invoice.invoiceValue).to.equal(12345);
        expect(invoice.netTotal).to.equal(12345);
      });
    });

    experiment('the 2020 invoice for customer 1', () => {
      let invoice;

      beforeEach(async () => {
        invoice = findInvoice(invoices, IDS.accountNumbers[0], 2020);
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has the correct CRM company, agent and contact', async () => {
        expect(invoice.invoiceAccount.company.id).to.equal(IDS.companies[0]);
        expect(invoice.agentCompany.id).to.equal(IDS.companies[1]);
        expect(invoice.contact.id).to.equal(IDS.contacts[0]);
      });

      test('has 2 transactions', async () => {
        expect(invoice.invoiceLicences[0].transactions).to.be.an.array().length(2);
      });

      test('has the correct transaction amount for transaction 1', async () => {
        const transaction = find(invoice.invoiceLicences[0].transactions, { externalId: IDS.transactions[4] });
        expect(transaction.value).to.equal(100);
      });

      test('has the correct transaction amount for transaction 2', async () => {
        const transaction = find(invoice.invoiceLicences[0].transactions, { externalId: IDS.transactions[5] });
        expect(transaction.value).to.equal(-200);
      });

      test('has a correct financial summary', async () => {
        expect(invoice.creditNoteValue).to.equal(-200);
        expect(invoice.invoiceValue).to.equal(100);
        expect(invoice.netTotal).to.equal(-100);
      });
    });

    experiment('the 2019 invoice for customer 2', () => {
      let invoice;

      beforeEach(async () => {
        invoice = findInvoice(invoices, IDS.accountNumbers[1], 2019);
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has the correct CRM company, agent and contact', async () => {
        expect(invoice.invoiceAccount.company.id).to.equal(IDS.companies[2]);
        expect(invoice.agentCompany).to.be.undefined();
        expect(invoice.contact).to.be.undefined();
      });

      test('has 2 transactions', async () => {
        expect(invoice.invoiceLicences[0].transactions).to.be.an.array().length(2);
      });

      test('has the correct transaction amount for transaction 1', async () => {
        const transaction = find(invoice.invoiceLicences[0].transactions, { externalId: IDS.transactions[2] });
        expect(transaction.value).to.equal(400);
      });

      test('has the correct transaction amount for transaction 2', async () => {
        const transaction = find(invoice.invoiceLicences[0].transactions, { externalId: IDS.transactions[3] });
        expect(transaction.value).to.equal(123);
      });

      test('has a correct financial summary', async () => {
        expect(invoice.creditNoteValue).to.equal(0);
        expect(invoice.invoiceValue).to.equal(523);
        expect(invoice.netTotal).to.equal(523);
      });
    });
  });

  experiment('.getInvoiceForBatch', () => {
    experiment('when the billing invoice is not found', () => {
      beforeEach(async () => {
        repos.billingInvoices.findOne.resolves(null);
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => invoiceService.getInvoiceForBatch(batch, IDS.invoices[0]);
        const err = await expect(func()).to.reject();
        expect(err instanceof NotFoundError).to.be.true();
        expect(err.message).to.equal(`Invoice ${IDS.invoices[0]} not found`);
      });
    });

    experiment('when the billing batch ID does not match', () => {
      beforeEach(async () => {
        const invoice = {
          ...createBatchData().billingInvoices[0],
          billingBatchId: uuid()
        };
        repos.billingInvoices.findOne.resolves(invoice);
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => invoiceService.getInvoiceForBatch(batch, IDS.invoices[0]);
        const err = await expect(func()).to.reject();
        expect(err instanceof NotFoundError);
        expect(err.message).to.equal(`Invoice ${IDS.invoices[0]} not found in batch ${IDS.batch}`);
      });
    });

    experiment('when the billing batch ID does match', () => {
      let invoice, billingInvoice;

      beforeEach(async () => {
        billingInvoice = createBatchData().billingInvoices[0];
        repos.billingInvoices.findOne.resolves(billingInvoice);
        invoice = await invoiceService.getInvoiceForBatch(batch, IDS.invoices[0]);
      });

      test('the correct billing invoice is found', async () => {
        expect(repos.billingInvoices.findOne.calledWith(IDS.invoices[0])).to.be.true();
      });

      experiment('the 2019 invoice for customer 1', () => {
        test('is an instance of Invoice', async () => {
          expect(invoice instanceof Invoice).to.be.true();
        });

        test('has the correct CRM company, agent and contact', async () => {
          expect(invoice.invoiceAccount.company.id).to.equal(IDS.companies[0]);
          expect(invoice.agentCompany.id).to.equal(IDS.companies[1]);
          expect(invoice.contact.id).to.equal(IDS.contacts[0]);
        });

        test('has 2 transactions', async () => {
          expect(invoice.invoiceLicences[0].transactions).to.be.an.array().length(2);
        });

        test('has the correct transaction amount for transaction 1', async () => {
          const transaction = find(invoice.invoiceLicences[0].transactions, { externalId: IDS.transactions[0] });
          expect(transaction.value).to.equal(2345);
        });

        test('has the correct transaction amount for transaction 2', async () => {
          const transaction = find(invoice.invoiceLicences[0].transactions, { externalId: IDS.transactions[1] });
          expect(transaction.value).to.equal(10000);
        });

        test(' has a correct financial summary', async () => {
          expect(invoice.creditNoteValue).to.equal(0);
          expect(invoice.invoiceValue).to.equal(12345);
          expect(invoice.netTotal).to.equal(12345);
        });
      });
    });
  });

  experiment('.saveInvoiceToDB', () => {
    const batchId = uuid();
    const batch = new Batch(batchId);
    const invoice = new Invoice();

    beforeEach(async () => {
      mappers.invoice.modelToDb.returns({ foo: 'bar' });
      await invoiceService.saveInvoiceToDB(batch, invoice);
    });

    test('calls the relevant mapper with the batch and invoice', async () => {
      expect(mappers.invoice.modelToDb.calledWith(invoice)).to.be.true();
    });

    test('calls .upsert() on the repo with the result of the mapping', async () => {
      expect(repos.billingInvoices.upsert.calledWith({
        foo: 'bar',
        billingBatchId: batchId
      })).to.be.true();
    });
  });

  experiment('.getOrCreateInvoice', () => {
    const invoiceAccountId = uuid();
    const financialYearEnding = 2022;
    let result;

    experiment('when the invoice exists', () => {
      beforeEach(async () => {
        repos.billingInvoices.findOneBy.resolves(
          createBatchData().billingInvoices[0]
        );
        result = await invoiceService.getOrCreateInvoice(IDS.batch, invoiceAccountId, financialYearEnding);
      });

      test('the row is fetched from the DB', async () => {
        expect(repos.billingInvoices.findOneBy.calledWith({
          billingBatchId: IDS.batch,
          invoiceAccountId,
          financialYearEnding,
          rebillingState: null
        })).to.be.true();
      });

      test('no rows are created', async () => {
        expect(repos.billingInvoices.upsert.called).to.be.false();
      });

      test('no data is fetched from the CRM', async () => {
        expect(invoiceAccountsConnector.getInvoiceAccountsByIds.called).to.be.false();
      });

      test('resolves with an Invoice model', async () => {
        expect(result instanceof Invoice).to.be.true();
        expect(result.id).to.equal(IDS.invoices[0]);
      });
    });

    experiment('when the invoice does not exist', () => {
      beforeEach(async () => {
        repos.billingInvoices.create.resolves(
          createBatchData().billingInvoices[0]
        );
        repos.billingInvoices.findOneBy.resolves(null);
        result = await invoiceService.getOrCreateInvoice(IDS.batch, invoiceAccountId, financialYearEnding);
      });

      test('the row is fetched from the DB', async () => {
        expect(repos.billingInvoices.findOneBy.calledWith({
          billingBatchId: IDS.batch,
          invoiceAccountId,
          financialYearEnding,
          rebillingState: null
        })).to.be.true();
      });

      test('the invoice account is fetched from the CRM', async () => {
        expect(invoiceAccountsConnector.getInvoiceAccountsByIds.calledWith(
          [invoiceAccountId]
        )).to.be.true();
      });

      test('the row is created', async () => {
        expect(repos.billingInvoices.create.called).to.be.true();
      });

      test('resolves with an Invoice model', async () => {
        expect(result instanceof Invoice).to.be.true();
        expect(result.id).to.equal(IDS.invoices[0]);
      });
    });
  });

  experiment('.getInvoicesForInvoiceAccount', () => {
    let result;
    const invoiceAccountId = uuid();
    const invoice = new Invoice(invoiceAccountId);

    beforeEach(async () => {
      sandbox.stub(mappers.invoice, 'dbToModel').returns({ foo: 'bar' });
      repos.billingInvoices.findAllForInvoiceAccount.resolves({ data: [invoice], pagination: { page: 1, perPage: 10 } });
      result = await invoiceService.getInvoicesForInvoiceAccount(invoiceAccountId);
    });

    test('calls the .upsert() on the repo with the invoice account id', async () => {
      expect(repos.billingInvoices.findAllForInvoiceAccount.calledWith(invoiceAccountId)).to.be.true();
    });

    test('maps the results of the repo call', async () => {
      expect(mappers.invoice.dbToModel.calledWith(invoice)).to.be.true();
    });

    test('returns mapped data and pagination', async () => {
      expect(result.data).to.equal([{ foo: 'bar' }]);
      expect(result.pagination).to.equal({ page: 1, perPage: 10 });
    });
  });

  experiment('.getInvoiceById', () => {
    const invoiceId = uuid();

    test('calls .findOne() on the repo with the invoice id', async () => {
      repos.billingInvoices.findOne.resolves({ foo: 'bar' });
      await invoiceService.getInvoiceById(invoiceId);
      expect(repos.billingInvoices.findOne.calledWith(invoiceId)).to.be.true();
    });

    test('throws a NotFoundError if no data is returned', async () => {
      repos.billingInvoices.findOne.resolves(null);
      try {
        await invoiceService.getInvoiceById(invoiceId);
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError);
        expect(err.message).to.equal(`Invoice ${invoiceId} not found`);
      }
    });
  });

  experiment('.updateInvoice', () => {
    const invoiceId = uuid();
    const changes = { isFlaggedForRebilling: true };
    let result;

    beforeEach(async () => {
      sandbox.stub(mappers.invoice, 'dbToModel').returns({ bar: 'baz' });

      repos.billingInvoices.update.resolves({ foo: 'bar' });
      result = await invoiceService.updateInvoice(invoiceId, changes);
    });

    test('calls .update() on the repo with the invoice id', async () => {
      expect(repos.billingInvoices.update.calledWith(invoiceId, changes)).to.be.true();
    });

    test('maps the invoice to the model', async () => {
      expect(mappers.invoice.dbToModel.calledWith({ foo: 'bar' })).to.be.true();
    });

    test('returns the result of the mapping', () => {
      expect(result).to.equal({ bar: 'baz' });
    });
  });

  experiment('.getInvoicesFlaggedForRebilling', () => {
    const regionId = uuid();
    let result;

    beforeEach(async () => {
      repos.billingInvoices.findByIsFlaggedForRebillingAndRegion.resolves(createBatchData().billingInvoices);
      result = await invoiceService.getInvoicesFlaggedForRebilling(regionId);
    });

    test('calls .findByIsFlaggedForRebillingAndRegion() repo method with the region ID', async () => {
      expect(repos.billingInvoices.findByIsFlaggedForRebillingAndRegion.calledWith(regionId)).to.be.true();
    });

    test('resolves with array of Invoice service models', async () => {
      expect(result).to.be.an.array().length(3);
      result.forEach(
        item => expect(item).to.be.an.instanceOf(Invoice)
      );
    });
  });

  experiment('.rebillInvoice', () => {
    let batch, invoice, result;

    beforeEach(async () => {
      batch = createBatch();
      invoice = new Invoice().fromHash({
        id: uuid(),
        externalId: uuid()
      });
      repos.billingInvoices.update.resolves({});
    });

    experiment('when the CM responds with no errors', () => {
      beforeEach(async () => {
        result = await invoiceService.rebillInvoice(batch, invoice);
      });

      test('the request is made to the charge module rebilling API connector', async () => {
        expect(chargeModuleBillRunApi.rebillInvoice.calledWith(
          batch.externalId,
          invoice.externalId
        )).to.be.true();
      });

      test('no message is logged', async () => {
        expect(logger.info.called).to.be.false();
        expect(logger.error.called).to.be.false();
      });

      test('the invoice is updated so that the originalBillingInvoiceId = the invoice ID', async () => {
        expect(repos.billingInvoices.update.calledWith(
          invoice.id, {
            originalBillingInvoiceId: invoice.id,
            rebillingState: null
          }
        )).to.be.true();
      });

      test('resolves with the updated Invoice model', async () => {
        expect(result).to.be.an.instanceOf(Invoice);
      });
    });

    experiment('when the CM responds with a 409 error', () => {
      beforeEach(async () => {
        const err = new Error('Oh no');
        err.statusCode = 409;
        chargeModuleBillRunApi.rebillInvoice.rejects(err);
        result = await invoiceService.rebillInvoice(batch, invoice);
      });

      test('the request is made to the charge module rebilling API connector', async () => {
        expect(chargeModuleBillRunApi.rebillInvoice.calledWith(
          batch.externalId,
          invoice.externalId
        )).to.be.true();
      });

      test('an info message is logged', async () => {
        expect(logger.info.called).to.be.true();
        expect(logger.error.called).to.be.false();
      });

      test('the invoice is updated so that the originalBillingInvoiceId = the invoice ID', async () => {
        expect(repos.billingInvoices.update.calledWith(
          invoice.id, {
            originalBillingInvoiceId: invoice.id,
            rebillingState: null
          }
        )).to.be.true();
      });

      test('resolves with the updated Invoice model', async () => {
        expect(result).to.be.an.instanceOf(Invoice);
      });
    });

    experiment('when the CM responds with a non-409 error', () => {
      beforeEach(async () => {
        const err = new Error('Oh no');
        err.statusCode = 400;
        chargeModuleBillRunApi.rebillInvoice.rejects(err);
      });

      test('the error is logged and rethrown', async () => {
        const func = () => invoiceService.rebillInvoice(batch, invoice);
        await expect(func()).to.reject();
        expect(logger.error.called).to.be.true();
      });
    });
  });

  experiment('.setIsFlaggedForRebilling', () => {
    const invoiceId = uuid();

    experiment('when the invoice is not found', () => {
      beforeEach(() => {
        repos.billingInvoices.findOne.resolves(null);
      });

      test('throws a NotFoundError', async () => {
        const func = () => invoiceService.setIsFlaggedForRebilling(invoiceId, true);
        const err = await expect(func()).to.reject();
        expect(err).to.be.instanceOf(NotFoundError);
      });
    });

    experiment('when the invoice found is not sent', () => {
      beforeEach(() => {
        repos.billingInvoices.findOne.resolves({
          billingInvoiceId: invoiceId,
          invoiceNumber: null
        });
      });

      test('throws a ConflictingDataError', async () => {
        const func = () => invoiceService.setIsFlaggedForRebilling(invoiceId, true);
        const err = await expect(func()).to.reject();
        expect(err).to.be.instanceOf(ConflictingDataError);
      });
    });

    experiment('when the invoice is already re-billed', () => {
      beforeEach(() => {
        repos.billingInvoices.findOne.resolves({
          billingInvoiceId: invoiceId,
          invoiceNumber: 'A123'
        });
        repos.billingInvoices.findOneBy.resolves({
          id: 'old-invoice-id'
        });
      });

      test('throws a ConflictingDataError', async () => {
        const func = () => invoiceService.setIsFlaggedForRebilling(invoiceId, true);
        const err = await expect(func()).to.reject();
        expect(err).to.be.instanceOf(ConflictingDataError);
      });
    });

    experiment('when the invoice can be re-billed', () => {
      beforeEach(async () => {
        repos.billingInvoices.findOne.resolves({
          billingInvoiceId: invoiceId,
          invoiceNumber: 'A123'
        });
        repos.billingInvoices.findOneBy.resolves(null);
        invoiceService.setIsFlaggedForRebilling(invoiceId, true);
      });

      test('sets the flag', () => {
        expect(repos.billingInvoices.update.calledWith(
          invoiceId, { isFlaggedForRebilling: true }
        )).to.be.true();
      });
    });
  });
});
