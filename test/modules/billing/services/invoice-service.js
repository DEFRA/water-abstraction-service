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

const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const Transaction = require('../../../../src/lib/models/transaction');
const ChargeModuleTransaction = require('../../../../src/lib/models/charge-module-transaction');
const Company = require('../../../../src/lib/models/company');
const Contact = require('../../../../src/lib/models/contact-v2');
const Address = require('../../../../src/lib/models/address');
const Role = require('../../../../src/lib/models/role');

const repos = require('../../../../src/lib/connectors/repository');
const invoiceService = require('../../../../src/modules/billing/services/invoice-service');
const transactionService = require('../../../../src/modules/billing/services/transactions-service');
const invoiceAccountsService = require('../../../../src/modules/billing/services/invoice-accounts-service');

const INVOICE_1_ID = uuid();
const INVOICE_2_ID = uuid();
const INVOICE_1_ACCOUNT_ID = uuid();
const INVOICE_1_ACCOUNT_NUMBER = 'A11111111A';
const INVOICE_2_ACCOUNT_ID = uuid();
const INVOICE_2_ACCOUNT_NUMBER = 'A22222222A';
const COMPANY_1_ID = uuid();
const COMPANY_2_ID = uuid();
const CONTACT_1_ID = uuid();
const CONTACT_2_ID = uuid();
const LICENCE_HOLDER_1 = {
  startDate: '2018-01-01',
  endDate: null,
  roleName: 'licenceHolder',
  contact: new Contact(CONTACT_1_ID),
  company: new Company(COMPANY_1_ID),
  address: new Address(uuid())
};
const LICENCE_HOLDER_2 = {
  startDate: '2017-01-01',
  endDate: '2017-12-31',
  roleName: 'licenceHolder',
  contact: new Contact(CONTACT_2_ID),
  company: new Company(COMPANY_2_ID),
  address: new Address(uuid())
};

const createRole = data => Object.assign(new Role(), data);

const testResponse = [
  {
    'billing_invoices.billing_invoice_id': INVOICE_1_ID,
    'billing_invoices.invoice_account_number': INVOICE_1_ACCOUNT_NUMBER,
    'billing_invoices.invoice_account_id': INVOICE_1_ACCOUNT_ID,
    'billing_invoices.address': {},

    'billing_invoice_licences.billing_invoice_licence_id': uuid(),
    'billing_invoice_licences.licence_id': uuid(),
    'billing_invoice_licences.licence_ref': '111/LIC',
    'billing_invoice_licences.contact_id': CONTACT_1_ID,
    'billing_invoice_licences.address_id': uuid(),
    'billing_invoice_licences.company_id': uuid(),
    'billing_invoice_licences.licence_holders': [createRole(LICENCE_HOLDER_1)]
  },
  {
    'billing_invoices.billing_invoice_id': INVOICE_1_ID,
    'billing_invoices.invoice_account_number': INVOICE_1_ACCOUNT_NUMBER,
    'billing_invoices.invoice_account_id': INVOICE_1_ACCOUNT_ID,
    'billing_invoices.address': {},

    'billing_invoice_licences.billing_invoice_licence_id': uuid(),
    'billing_invoice_licences.licence_id': uuid(),
    'billing_invoice_licences.licence_ref': '222/LIC',
    'billing_invoice_licences.contact_id': CONTACT_1_ID,
    'billing_invoice_licences.address_id': uuid(),
    'billing_invoice_licences.company_id': uuid(),
    'billing_invoice_licences.licence_holders': [createRole(LICENCE_HOLDER_1)]
  },
  {
    'billing_invoices.billing_invoice_id': INVOICE_2_ID,
    'billing_invoices.invoice_account_number': INVOICE_2_ACCOUNT_NUMBER,
    'billing_invoices.invoice_account_id': INVOICE_2_ACCOUNT_ID,
    'billing_invoices.address': {},

    'billing_invoice_licences.billing_invoice_licence_id': uuid(),
    'billing_invoice_licences.licence_id': uuid(),
    'billing_invoice_licences.licence_ref': '333/LIC',
    'billing_invoice_licences.contact_id': CONTACT_2_ID,
    'billing_invoice_licences.address_id': uuid(),
    'billing_invoice_licences.company_id': uuid(),
    'billing_invoice_licences.licence_holders': [createRole(LICENCE_HOLDER_2), createRole(LICENCE_HOLDER_1)]
  }
];

let transaction1;
let transaction2;

let invoiceAccount1;
let invoiceAccount2;

experiment('modules/billing/services/invoiceService', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingInvoices, 'findByBatchId').resolves(testResponse);

    transaction1 = new ChargeModuleTransaction(uuid());
    transaction1.value = 100;
    transaction1.isCredit = false;
    transaction1.accountNumber = INVOICE_1_ACCOUNT_NUMBER;
    transaction1.licenceNumber = '111/LIC';

    transaction2 = new ChargeModuleTransaction(uuid());
    transaction2.value = 200;
    transaction2.isCredit = true;
    transaction2.accountNumber = INVOICE_2_ACCOUNT_NUMBER;
    transaction2.licenceNumber = '333/LIC';

    sandbox.stub(transactionService, 'getTransactionsForBatch').resolves([
      transaction1, transaction2
    ]);

    invoiceAccount1 = new InvoiceAccount(INVOICE_1_ACCOUNT_ID);
    invoiceAccount1.company = new Company(COMPANY_1_ID);
    invoiceAccount1.company.name = 'Test Company 1';

    invoiceAccount2 = new InvoiceAccount(INVOICE_2_ACCOUNT_ID);
    invoiceAccount2.company = new Company(COMPANY_2_ID);
    invoiceAccount2.company.name = 'Test Company 2';

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
      invoices = await invoiceService.getInvoicesForBatch('test');
    });

    test('returns the data as an array of Invoice models', async () => {
      expect(invoices).to.be.an.array();
      expect(invoices).to.have.length(2);
      expect(invoices[0]).to.be.instanceOf(Invoice);
      expect(invoices[1]).to.be.instanceOf(Invoice);
    });

    test('the invoices have the expected id values', async () => {
      expect(invoices[0].id).to.equal(INVOICE_1_ID);
      expect(invoices[1].id).to.equal(INVOICE_2_ID);
    });

    test('the invoices have the expected account details', async () => {
      expect(invoices[0].invoiceAccount.accountNumber).to.equal(INVOICE_1_ACCOUNT_NUMBER);
      expect(invoices[0].invoiceAccount.id).to.equal(INVOICE_1_ACCOUNT_ID);
      expect(invoices[1].invoiceAccount.accountNumber).to.equal(INVOICE_2_ACCOUNT_NUMBER);
      expect(invoices[1].invoiceAccount.id).to.equal(INVOICE_2_ACCOUNT_ID);
    });

    test('the invoices have InvoiceLicence objects', async () => {
      expect(invoices[0].invoiceLicences[0].licence.licenceNumber).to.equal('111/LIC');
      expect(invoices[0].invoiceLicences[1].licence.licenceNumber).to.equal('222/LIC');
      expect(invoices[1].invoiceLicences[0].licence.licenceNumber).to.equal('333/LIC');
    });

    test('the InvoiceLicence objects have the expected address id', async () => {
      expect(invoices[0].invoiceLicences[0].address.id).to.equal(
        testResponse[0]['billing_invoice_licences.address_id']
      );

      expect(invoices[0].invoiceLicences[1].address.id).to.equal(
        testResponse[1]['billing_invoice_licences.address_id']
      );

      expect(invoices[1].invoiceLicences[0].address.id).to.equal(
        testResponse[2]['billing_invoice_licences.address_id']
      );
    });

    test('the InvoiceLicence objects have the expected company id', async () => {
      expect(invoices[0].invoiceLicences[0].company.id).to.equal(
        testResponse[0]['billing_invoice_licences.company_id']
      );

      expect(invoices[0].invoiceLicences[1].company.id).to.equal(
        testResponse[1]['billing_invoice_licences.company_id']
      );

      expect(invoices[1].invoiceLicences[0].company.id).to.equal(
        testResponse[2]['billing_invoice_licences.company_id']
      );
    });

    test('the InvoiceAccount objects have the expected companies', async () => {
      expect(invoices[0].invoiceAccount.company.id).to.equal(invoiceAccount1.company.id);
      expect(invoices[0].invoiceAccount.company.name).to.equal(invoiceAccount1.company.name);

      expect(invoices[1].invoiceAccount.company.id).to.equal(invoiceAccount2.company.id);
      expect(invoices[1].invoiceAccount.company.name).to.equal(invoiceAccount2.company.name);
    });

    test('the InvoiceLicence objects have the expected transactions', async () => {
      // the first licence on the first invoice has a transaction
      expect(invoices[0].invoiceLicences[0].transactions).to.have.length(1);
      expect(invoices[0].invoiceLicences[0].transactions[0]).to.be.instanceOf(Transaction);
      expect(invoices[0].invoiceLicences[0].transactions[0].value).to.equal(100);
      expect(invoices[0].invoiceLicences[0].transactions[0].isCredit).to.be.false();

      // the second licence on the first invoice has no transactions
      expect(invoices[0].invoiceLicences[1].transactions).to.have.length(0);

      // the first licence on the second invoice has a transaction
      expect(invoices[1].invoiceLicences[0].transactions).to.have.length(1);
      expect(invoices[1].invoiceLicences[0].transactions[0].value).to.equal(200);
      expect(invoices[1].invoiceLicences[0].transactions[0].isCredit).to.be.true();
    });

    test('the InvoiceLicence objects have the expected roles', async () => {
      expect(invoices[0].invoiceLicences[0].roles).to.equal(
        testResponse[0]['billing_invoice_licences.licence_holders']
      );

      expect(invoices[0].invoiceLicences[1].roles).to.equal(
        testResponse[1]['billing_invoice_licences.licence_holders']
      );

      expect(invoices[1].invoiceLicences[0].roles).to.equal(
        testResponse[2]['billing_invoice_licences.licence_holders']
      );
    });
  });
});
