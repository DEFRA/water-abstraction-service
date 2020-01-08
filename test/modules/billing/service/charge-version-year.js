const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();
const { Address, Batch, Company, Invoice, InvoiceAccount, InvoiceLicence, Licence, Transaction } = require('../../../../src/lib/models');
const Contact = require('../../../../src/lib/models/contact-v2');

const chargeVersionYear = require('../../../../src/modules/billing/service/charge-version-year');
const chargeProcessor = require('../../../../src/modules/billing/service/charge-processor');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const transactionsService = require('../../../../src/modules/billing/services/transactions-service');

const repository = require('../../../../src/lib/connectors/repository');

const { logger } = require('../../../../src/logger');

const batchId = '6556baab-4e69-4bba-89d8-7c6403f8ac8d';
const chargeVersionId = 'charge_version_1';

const data = {
  billingInvoiceId: '991675b7-4760-49eb-8adf-e240770d21eb',
  transactionId1: 'd34d196f-15a9-4d1e-9d24-e6d446aef493',
  transactionId2: '6697bf08-0602-40d1-947d-4cb80d2c2d84',
  chargeVersionYear: {
    charge_version_id: chargeVersionId,
    financial_year_ending: 2020,
    billing_batch_id: batchId
  },
  charges: [{

  }],
  modelMapperResponse: new Batch(),
  company: {
    id: '710014ac-381e-41b6-a14b-0696efa4fc31',
    type: 'organisation',
    name: 'Really Big Farm Ltd'
  },
  contact: {
    id: '62d82f1d-73aa-4126-9700-105a427474f4',
    salutation: 'Mrs',
    firstName: 'Joan',
    lastName: 'Doe'
  },
  licence: {
    id: '490479e9-7cb7-44c2-8af8-bd178eb61b1c',
    licenceNumber: '01/234/*ABC'
  },
  address: {
    id: '1f8a29a9-7d07-4c21-8fba-f73f72f5a72b',
    addressLine1: 'Daisy Farm',
    addressLine2: 'Buttercup Lane',
    addressLine3: 'Windy Hill',
    addressLine4: 'Green Meadows',
    town: 'Testington',
    county: 'Testingshire',
    postcode: 'TT1 1TT',
    country: 'England'
  },
  invoiceAccount: {
    id: 'b5b37451-27e5-457e-a2d8-2751ee99cd01',
    accountNumber: 'S12345678A'
  }
};

const createCompany = () =>
  Object.assign(new Company(), data.company);

const createLicence = () =>
  Object.assign(new Licence(), data.licence);

const createContact = () =>
  Object.assign(new Contact(), data.contact);

const createAddress = () =>
  Object.assign(new Address(), data.address);

const createInvoiceAccount = () =>
  Object.assign(new InvoiceAccount(), data.invoiceAccount);

experiment('modules/billing/service/charge-version-year.js', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'error');
    sandbox.stub(chargeProcessor, 'processCharges');
    sandbox.stub(batchService, 'mapChargeDataToModel').returns(data.modelMapperResponse);
    sandbox.stub(repository.billingInvoices, 'create').resolves({
      rows: [{
        billing_invoice_id: data.billingInvoiceId
      }]
    });
    sandbox.stub(repository.licences, 'findOneByLicenceNumber').resolves({
      licence_id: data.licence.id
    });
    sandbox.stub(repository.billingInvoiceLicences, 'create').resolves({
      rows: [{
        billing_invoice_licence_id: data.billingInvoiceId
      }]
    });
    sandbox.stub(transactionsService, 'saveTransactionToDB').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createBatchFromChargeVersionYear', () => {
    let result;

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        chargeProcessor.processCharges.resolves({
          error: null,
          data: data.charges
        });
        result = await chargeVersionYear.createBatchFromChargeVersionYear(data.chargeVersionYear);
      });

      test('calls the charge processor', async () => {
        expect(chargeProcessor.processCharges.calledWith(
          data.chargeVersionYear.financial_year_ending,
          data.chargeVersionYear.charge_version_id
        )).to.be.true();
      });

      test('does not log an error', async () => {
        expect(logger.error.called).to.be.false();
      });

      test('resolves with the result of the model mapping', async () => {
        expect(result).to.equal(data.modelMapperResponse);
      });
    });

    experiment('when there is an error', () => {
      beforeEach(async () => {
        chargeProcessor.processCharges.resolves({
          error: 'Oh no!',
          data: data.charges
        });
        try {
          await chargeVersionYear.createBatchFromChargeVersionYear(data.chargeVersionYear);
          fail();
        } catch (err) {
        }
      });

      test('logs an error', async () => {
        const [msg, error, data] = logger.error.lastCall.args;
        expect(msg).to.equal('Oh no!');
        expect(error).to.be.an.error();
        expect(data).to.equal({ chargeVersionYear: data.chargeVersionYear });
      });
    });
  });

  experiment('.persistChargeVersionYearBatch', async () => {
    let batch;

    experiment('when a Batch instance is supplied', () => {
      beforeEach(async () => {
        // Create batch
        batch = new Batch();
        batch.id = batchId;

        // Create invoice
        const invoice = new Invoice();
        invoice.invoiceAccount = createInvoiceAccount();
        invoice.address = createAddress();

        // Set up invoice licence
        const invoiceLicence = new InvoiceLicence();
        invoiceLicence.licence = createLicence();
        invoiceLicence.company = createCompany();
        invoiceLicence.contact = createContact();
        invoiceLicence.address = createAddress();
        invoice.invoiceLicences = [invoiceLicence];

        // Set up transactions
        invoiceLicence.transactions = [
          new Transaction(data.transactionId1),
          new Transaction(data.transactionId2)
        ];

        batch.addInvoice(invoice);

        await chargeVersionYear.persistChargeVersionYearBatch(batch);
      });

      test('one invoice is created for each licence in batch', async () => {
        expect(repository.billingInvoices.create.callCount).to.equal(1);
      });

      test('calls transactionService.saveTransactionToDB for the first transaction', async () => {
        const [invoiceLicence, transaction] = transactionsService.saveTransactionToDB.firstCall.args;
        expect(invoiceLicence instanceof InvoiceLicence).to.be.true();
        expect(transaction instanceof Transaction).to.be.true();
        expect(transaction.id).to.equal(data.transactionId1);
      });

      test('calls transactionService.saveTransactionToDB for the second transaction', async () => {
        const [invoiceLicence, transaction] = transactionsService.saveTransactionToDB.lastCall.args;
        expect(invoiceLicence instanceof InvoiceLicence).to.be.true();
        expect(transaction instanceof Transaction).to.be.true();
        expect(transaction.id).to.equal(data.transactionId2);
      });

      test('persists each invoice in the batch', async () => {
        const [row] = repository.billingInvoices.create.lastCall.args;
        expect(row).to.equal({
          invoice_account_id: 'b5b37451-27e5-457e-a2d8-2751ee99cd01',
          invoice_account_number: 'S12345678A',
          address:
          {
            addressLine1: 'Daisy Farm',
            addressLine2: 'Buttercup Lane',
            addressLine3: 'Windy Hill',
            addressLine4: 'Green Meadows',
            town: 'Testington',
            county: 'Testingshire',
            postcode: 'TT1 1TT',
            country: 'England'
          },
          billing_batch_id: '6556baab-4e69-4bba-89d8-7c6403f8ac8d'
        });
      });

      test('one invoice licence is created for each licence in batch', async () => {
        expect(repository.billingInvoiceLicences.create.callCount).to.equal(1);
      });

      test('persists each licence in the batch', async () => {
        const [row] = repository.billingInvoiceLicences.create.lastCall.args;
        expect(row).to.equal({
          billing_invoice_id: data.billingInvoiceId,
          company_id: data.company.id,
          contact_id: data.contact.id,
          address_id: data.address.id,
          licence_ref: data.licence.licenceNumber,
          licence_holder_name: {
            id: data.contact.id,
            salutation: data.contact.salutation,
            firstName: data.contact.firstName,
            lastName: data.contact.lastName
          },
          licence_holder_address: {
            addressLine1: 'Daisy Farm',
            addressLine2: 'Buttercup Lane',
            addressLine3: 'Windy Hill',
            addressLine4: 'Green Meadows',
            country: 'England',
            county: 'Testingshire',
            id: '1f8a29a9-7d07-4c21-8fba-f73f72f5a72b',
            postcode: 'TT1 1TT',
            town: 'Testington'
          },
          licence_id: data.licence.id
        });
      });
    });

    experiment('when the argument is not an instance of Batch', () => {
      beforeEach(async () => {
        batch = { not_a: 'Valid batch' };
      });

      test('an error is thrown', async () => {
        try {
          await chargeVersionYear.persistChargeVersionYearBatch(batch);
          fail();
        } catch (err) {
          expect(err).to.be.an.error();
        }
      });
    });
  });
});
