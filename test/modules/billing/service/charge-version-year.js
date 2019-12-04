const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();
const { Batch, Invoice, InvoiceAccount, Address } = require('../../../../src/lib/models');

const chargeVersionYear = require('../../../../src/modules/billing/service/charge-version-year');
const chargeProcessor = require('../../../../src/modules/billing/service/charge-processor');
const repository = require('../../../../src/lib/connectors/repository');
const { logger } = require('../../../../src/logger');

const batchId = '6556baab-4e69-4bba-89d8-7c6403f8ac8d';
const chargeVersionId = 'charge_version_1';

const data = {
  chargeVersionYear: {
    charge_version_id: chargeVersionId,
    financial_year_ending: 2020,
    billing_batch_id: batchId
  },
  charges: [{

  }],
  modelMapperResponse: new Batch()
};

experiment('modules/billing/service/charge-version-year.js', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'error');
    sandbox.stub(chargeProcessor, 'processCharges');
    sandbox.stub(chargeProcessor, 'modelMapper').returns(data.modelMapperResponse);
    sandbox.stub(repository.billingInvoices, 'create');
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
        expect(logger.error.calledWith(
          'Error processing charge version year',
          data.chargeVersionYear
        )).to.be.true();
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
        invoice.invoiceAccount = new InvoiceAccount();
        invoice.invoiceAccount.id = 'b5b37451-27e5-457e-a2d8-2751ee99cd01';
        invoice.invoiceAccount.accountNumber = 'S12345678A';
        invoice.address = new Address();
        invoice.address.id = '1f8a29a9-7d07-4c21-8fba-f73f72f5a72b';
        invoice.address.addressLine1 = 'Daisy Farm';
        invoice.address.addressLine2 = 'Buttercup Lane';
        invoice.address.addressLine3 = 'Windy Hill';
        invoice.address.addressLine4 = 'Green Meadows';
        invoice.address.town = 'Testington';
        invoice.address.county = 'Testingshire';
        invoice.address.postcode = 'TT1 1TT';
        invoice.address.country = 'England';
        batch.addInvoice(invoice);

        await chargeVersionYear.persistChargeVersionYearBatch(batch);
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
