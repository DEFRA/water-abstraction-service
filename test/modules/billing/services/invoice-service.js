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
const ChargeModuleTransaction = require('../../../../src/lib/models/charge-module-transaction');
const Company = require('../../../../src/lib/models/company');
const Contact = require('../../../../src/lib/models/contact-v2');
const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const Transaction = require('../../../../src/lib/models/transaction');

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

    test('the InvoiceLicences objects have the expected transactions', async () => {
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
  });

  experiment('.mapChargeDataToModels', () => {
    const BATCH_ID = '6556baab-4e69-4bba-89d8-7c6403f8ac8d';

    const createCrmAddress = index => ({
      addressId: `7d78cca3-4ed5-457d-a594-2b9687b7870${index}`,
      address1: `address1_${index}`,
      address2: `address2_${index}`,
      address3: `address3_${index}`,
      address4: `address4_${index}`,
      town: `town_${index}`,
      county: `county_${index}`,
      postcode: `country_${index}`,
      country: `country_${index}`
    });

    const createCrmInvoiceAccount = index => ({
      invoiceAccountId: `20776517-ce06-4a3d-a898-7ffa921b802${index}`,
      invoiceAccountNumber: `S1234567${index}A`
    });

    const createChargeVersion = licenceRef => ({
      licenceRef,
      licenceId: 'dc6468fd-5991-4de8-ace3-f8609db03186'
    });

    const createCrmContact = () => ({
      contactId: '8d72ac2f-a16e-4226-ab56-0065b5af058d',
      salutation: 'Captain',
      initials: 'J T',
      firstName: 'James',
      lastName: 'Kirk'
    });

    const createCrmLicenceHolder = withContact => ({
      company: {
        companyId: 'a4d2ad99-4cda-4634-b1a2-a665aa125554',
        name: 'Big Farm Ltd'
      },
      contact: withContact ? createCrmContact() : null,
      address: createCrmAddress(1)
    });

    const createData = () => [{
      chargeVersion: createChargeVersion('01/123'),
      licenceHolder: createCrmLicenceHolder(),
      invoiceAccount: {
        invoiceAccount: createCrmInvoiceAccount(1),
        address: createCrmAddress(1)
      },
      chargeElements: []
    }, {
      chargeVersion: createChargeVersion('02/345'),
      licenceHolder: createCrmLicenceHolder(true),
      invoiceAccount: {
        invoiceAccount: createCrmInvoiceAccount(2),
        address: createCrmAddress(2)
      },
      chargeElements: []
    }, {
      chargeVersion: createChargeVersion('03/456'),
      licenceHolder: createCrmLicenceHolder(),
      invoiceAccount: {
        invoiceAccount: createCrmInvoiceAccount(1),
        address: createCrmAddress(1)
      },
      chargeElements: []
    }];

    let data, result, invoice;

    beforeEach(async () => {
      data = createData();
      const batch = new Batch(BATCH_ID);
      result = invoiceService.mapChargeDataToModels(data, batch);
    });

    test('should have 2 invoices (invoice account IDs must be unique in batch)', async () => {
      expect(result).to.be.an.array().length(2);
    });

    experiment('the first invoice', () => {
      beforeEach(async () => {
        invoice = result[0];
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has an InvoiceAccount instance', async () => {
        expect(invoice.invoiceAccount instanceof InvoiceAccount).to.be.true();
      });

      test('has the correct account number', async () => {
        expect(invoice.invoiceAccount.accountNumber).to.equal('S12345671A');
      });

      test('has the correct address', async () => {
        expect(invoice.address instanceof Address).to.be.true();
        expect(invoice.address.id).to.equal(data[0].invoiceAccount.address.addressId);
      });

      test('has an invoiceLicence for each licence', async () => {
        expect(invoice.invoiceLicences).to.have.length(2);
        expect(invoice.invoiceLicences[0].licence.licenceNumber).to.equal('01/123');
        expect(invoice.invoiceLicences[1].licence.licenceNumber).to.equal('03/456');
      });

      test('the first invoiceLicence has an address', async () => {
        expect(invoice.invoiceLicences[0].address instanceof Address).to.be.true();
      });

      test('the first invoiceLicence has a company', async () => {
        expect(invoice.invoiceLicences[0].company instanceof Company).to.be.true();
      });

      test('the first invoiceLicence has no contact', async () => {
        expect(invoice.invoiceLicences[0].contact).to.be.undefined();
      });

      test('the second invoiceLicence has an address', async () => {
        expect(invoice.invoiceLicences[1].address instanceof Address).to.be.true();
      });

      test('the second invoiceLicence has a company', async () => {
        expect(invoice.invoiceLicences[1].company instanceof Company).to.be.true();
      });

      test('the second invoiceLicence has no contact', async () => {
        expect(invoice.invoiceLicences[1].contact).to.be.undefined();
      });
    });

    experiment('the second invoice', () => {
      beforeEach(async () => {
        invoice = result[1];
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has an InvoiceAccount instance', async () => {
        expect(invoice.invoiceAccount instanceof InvoiceAccount).to.be.true();
      });

      test('has the correct account number', async () => {
        expect(invoice.invoiceAccount.accountNumber).to.equal('S12345672A');
      });

      test('has the correct address', async () => {
        expect(invoice.address instanceof Address).to.be.true();
        expect(invoice.address.id).to.equal(data[1].invoiceAccount.address.addressId);
      });

      test('has an invoiceLicence for each licence', async () => {
        expect(invoice.invoiceLicences).to.have.length(1);
        expect(invoice.invoiceLicences[0].licence.licenceNumber).to.equal('02/345');
      });

      test('the first invoiceLicence has an address', async () => {
        expect(invoice.invoiceLicences[0].address instanceof Address).to.be.true();
      });

      test('the first invoiceLicence has a company', async () => {
        expect(invoice.invoiceLicences[0].company instanceof Company).to.be.true();
      });

      test('the first invoiceLicence has a contact', async () => {
        const { contact } = invoice.invoiceLicences[0];
        expect(contact instanceof Contact).to.be.true();
        expect(contact.fullName).to.equal('Captain J T Kirk');
      });
    });
  });
});
