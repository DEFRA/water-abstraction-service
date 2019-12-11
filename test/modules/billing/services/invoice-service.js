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
const Transaction = require('../../../../src/lib/models/transaction');
const Contact = require('../../../../src/lib/models/contact-v2');

const repos = require('../../../../src/lib/connectors/repository');
const invoiceService = require('../../../../src/modules/billing/services/invoice-service');
const transactionService = require('../../../../src/modules/billing/services/transactions-service');
const contactsService = require('../../../../src/modules/billing/services/contacts-service');

const INVOICE_1_ID = uuid();
const INVOICE_2_ID = uuid();
const INVOICE_1_ACCOUNT_ID = uuid();
const INVOICE_1_ACCOUNT_NUMBER = 'A11111111A';
const INVOICE_2_ACCOUNT_ID = uuid();
const INVOICE_2_ACCOUNT_NUMBER = 'A22222222A';
const CONTACT_1_ID = uuid();
const CONTACT_2_ID = uuid();

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
    'billing_invoice_licences.company_id': uuid()
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
    'billing_invoice_licences.company_id': uuid()
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
    'billing_invoice_licences.company_id': uuid()
  }
];

let transaction1;
let transaction2;

let contact1;
let contact2;

experiment('modules/billing/services/invoiceService', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingInvoices, 'findByBatchId').resolves(testResponse);

    transaction1 = new Transaction(uuid(), 100);
    transaction1.accountNumber = INVOICE_1_ACCOUNT_NUMBER;
    transaction1.licenceNumber = '111/LIC';

    transaction2 = new Transaction(uuid(), 200);
    transaction2.accountNumber = INVOICE_2_ACCOUNT_NUMBER;
    transaction2.licenceNumber = '333/LIC';

    sandbox.stub(transactionService, 'getTransactionsForBatch').resolves([
      transaction1, transaction2
    ]);

    contact1 = new Contact(CONTACT_1_ID);
    contact1.firstName = 'Test1';

    contact2 = new Contact(CONTACT_2_ID);
    contact2.firstName = 'Test2';

    sandbox.stub(contactsService, 'getContacts').resolves([
      contact1, contact2
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

    test('the InvoiceLicence objects have the expected contacts', async () => {
      expect(invoices[0].invoiceLicences[0].contact.id).to.equal(contact1.id);
      expect(invoices[0].invoiceLicences[0].contact.firstName).to.equal(contact1.firstName);

      expect(invoices[0].invoiceLicences[1].contact.id).to.equal(contact1.id);
      expect(invoices[0].invoiceLicences[1].contact.firstName).to.equal(contact1.firstName);

      expect(invoices[1].invoiceLicences[0].contact.id).to.equal(contact2.id);
      expect(invoices[1].invoiceLicences[0].contact.firstName).to.equal(contact2.firstName);
    });

    test('the InvoiceLicences objects have the expected transactions', async () => {
      // the first licence on the first invoice has a transaction
      expect(invoices[0].invoiceLicences[0].transactions).to.have.length(1);
      expect(invoices[0].invoiceLicences[0].transactions[0].licenceNumber).to.equal('111/LIC');

      // the second licence on the first invoice has no transactions
      expect(invoices[0].invoiceLicences[1].transactions).to.have.length(0);

      // the first licence on the second invoice has a transaction
      expect(invoices[1].invoiceLicences[0].transactions).to.have.length(1);
      expect(invoices[1].invoiceLicences[0].transactions[0].licenceNumber).to.equal('333/LIC');
    });
  });
});
