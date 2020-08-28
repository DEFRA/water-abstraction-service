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

const Batch = require('../../../../src/lib/models/batch');
const Invoice = require('../../../../src/lib/models/invoice');
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants');

const mappers = require('../../../../src/modules/billing/mappers');
const repos = require('../../../../src/lib/connectors/repos');
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs');
const invoiceAccountsConnector = require('../../../../src/lib/connectors/crm-v2/invoice-accounts');

const invoiceService = require('../../../../src/modules/billing/services/invoice-service');

const { NotFoundError } = require('../../../../src/lib/errors');

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

const createChargeModuleData = () => ({
  billRun: {
    customers: [
      {
        // Customer 1
        customerReference: IDS.accountNumbers[0],
        summaryByFinancialYear: [
          // Year ending 2019
          {
            financialYear: 2018,
            creditLineCount: 0,
            creditLineValue: 0,
            debitLineCount: 2,
            debitLineValue: 12345,
            netTotal: 12345,
            deminimis: false,
            transactions: [{
              id: IDS.transactions[0],
              licenceNumber: '01/123/ABC',
              chargeValue: 2345,
              deminimis: false,
              minimumChargeAdjustment: false
            }, {
              id: IDS.transactions[1],
              licenceNumber: '01/123/ABC',
              chargeValue: 10000,
              deminimis: false,
              minimumChargeAdjustment: false
            }]
          },
          // Year ending 2020
          {
            financialYear: 2019,
            creditLineCount: 1,
            creditLineValue: -200,
            debitLineCount: 1,
            debitLineValue: 100,
            netTotal: -100,
            deminimis: false,
            transactions: [{
              id: IDS.transactions[4],
              licenceNumber: '01/123/ABC',
              chargeValue: 100,
              deminimis: false,
              minimumChargeAdjustment: false
            }, {
              id: IDS.transactions[5],
              licenceNumber: '01/123/ABC',
              chargeValue: -200,
              deminimis: false,
              minimumChargeAdjustment: false
            }]
          }
        ]
      }, {
        // Customer 2
        customerReference: IDS.accountNumbers[1],
        summaryByFinancialYear: [
          // Year ending 2019
          {
            financialYear: 2018,
            creditLineCount: 0,
            creditLineValue: 0,
            debitLineCount: 2,
            debitLineValue: 523,
            netTotal: 523,
            deminimis: false,
            transactions: [{
              id: IDS.transactions[2],
              licenceNumber: '01/123/ABC',
              chargeValue: 400,
              deminimis: false,
              minimumChargeAdjustment: false
            }, {
              id: IDS.transactions[3],
              licenceNumber: '01/123/ABC',
              chargeValue: 123,
              deminimis: false,
              minimumChargeAdjustment: false
            }]
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

const createTransaction = externalId => ({
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
  isDeMinimis: false
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
        billingInvoiceLicences: [{
          billingInvoiceId: IDS.invoices[0],
          billingInvoiceLicenceId: uuid(),
          licence: createLicence('01/123'),
          billingTransactions: [
            createTransaction(IDS.transactions[0]),
            createTransaction(IDS.transactions[1])
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
        billingInvoiceLicences: [{
          billingInvoiceId: IDS.invoices[1],
          billingInvoiceLicenceId: uuid(),
          licence: createLicence('02/456'),
          billingTransactions: [
            createTransaction(IDS.transactions[2]),
            createTransaction(IDS.transactions[3])
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
        billingInvoiceLicences: [{
          billingInvoiceId: IDS.invoices[2],
          billingInvoiceLicenceId: uuid(),
          licence: createLicence('01/123'),
          billingTransactions: [
            createTransaction(IDS.transactions[4]),
            createTransaction(IDS.transactions[5])
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
  let batch, chargeModuleData, crmData;

  beforeEach(async () => {
    batch = createBatch();
    chargeModuleData = createChargeModuleData();
    crmData = createCrmData();

    sandbox.stub(repos.billingBatches, 'findOneWithInvoices').resolves(createBatchDataWithoutTransactions());
    sandbox.stub(repos.billingBatches, 'findOneWithInvoicesWithTransactions').resolves(createBatchData());

    sandbox.stub(chargeModuleBillRunConnector, 'get').resolves(chargeModuleData);
    sandbox.stub(chargeModuleBillRunConnector, 'getCustomer').resolves(chargeModuleData);

    sandbox.stub(repos.billingInvoices, 'findOne').resolves();
    sandbox.stub(repos.billingInvoices, 'upsert').resolves();

    sandbox.stub(invoiceAccountsConnector, 'getInvoiceAccountsByIds').resolves(crmData);

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
        repos.billingBatches.findOneWithInvoices.calledWith(IDS.batch)
      ).to.be.true();
    });

    test('gets batch summary data from charge module with correct external ID', async () => {
      const [externalId] = chargeModuleBillRunConnector.get.lastCall.args;
      expect(externalId).to.equal(IDS.batchExternalId);
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
        const { totals } = invoice;

        expect(totals.creditLineCount).to.equal(0);
        expect(totals.creditLineValue).to.equal(0);
        expect(totals.debitLineCount).to.equal(2);
        expect(totals.debitLineValue).to.equal(12345);
        expect(totals.netTotal).to.equal(12345);
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
        const { totals } = invoice;

        expect(totals.creditLineCount).to.equal(1);
        expect(totals.creditLineValue).to.equal(-200);
        expect(totals.debitLineCount).to.equal(1);
        expect(totals.debitLineValue).to.equal(100);
        expect(totals.netTotal).to.equal(-100);
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
        expect(invoice.agentCompany).to.equal({ _companyAddresses: [], _companyContacts: [] });
        expect(invoice.contact).to.equal({});
      });

      test('has a correct financial summary', async () => {
        const { totals } = invoice;

        expect(totals.creditLineCount).to.equal(0);
        expect(totals.creditLineValue).to.equal(0);
        expect(totals.debitLineCount).to.equal(2);
        expect(totals.debitLineValue).to.equal(523);
        expect(totals.netTotal).to.equal(523);
      });
    });
  });

  experiment('.getInvoicesTransactionsForBatch', () => {
    let invoices;

    beforeEach(async () => {
      invoices = await invoiceService.getInvoicesTransactionsForBatch(batch);
    });

    test('gets batch with correct ID', async () => {
      expect(
        repos.billingBatches.findOneWithInvoicesWithTransactions.calledWith(IDS.batch)
      ).to.be.true();
    });

    test('gets batch summary data from charge module with correct external ID', async () => {
      const [externalId] = chargeModuleBillRunConnector.get.lastCall.args;
      expect(externalId).to.equal(IDS.batchExternalId);
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
        const { totals } = invoice;

        expect(totals.creditLineCount).to.equal(0);
        expect(totals.creditLineValue).to.equal(0);
        expect(totals.debitLineCount).to.equal(2);
        expect(totals.debitLineValue).to.equal(12345);
        expect(totals.netTotal).to.equal(12345);
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
        const { totals } = invoice;

        expect(totals.creditLineCount).to.equal(1);
        expect(totals.creditLineValue).to.equal(-200);
        expect(totals.debitLineCount).to.equal(1);
        expect(totals.debitLineValue).to.equal(100);
        expect(totals.netTotal).to.equal(-100);
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
        expect(invoice.agentCompany).to.equal({ _companyAddresses: [], _companyContacts: [] });
        expect(invoice.contact).to.equal({});
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
        const { totals } = invoice;

        expect(totals.creditLineCount).to.equal(0);
        expect(totals.creditLineValue).to.equal(0);
        expect(totals.debitLineCount).to.equal(2);
        expect(totals.debitLineValue).to.equal(523);
        expect(totals.netTotal).to.equal(523);
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
      let invoice;

      beforeEach(async () => {
        const billingInvoice = createBatchData().billingInvoices[0];
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
          const { totals } = invoice;

          expect(totals.creditLineCount).to.equal(0);
          expect(totals.creditLineValue).to.equal(0);
          expect(totals.debitLineCount).to.equal(2);
          expect(totals.debitLineValue).to.equal(12345);
          expect(totals.netTotal).to.equal(12345);
        });
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
});
