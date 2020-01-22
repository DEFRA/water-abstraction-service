const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { logger } = require('../../../../src/logger');
const createChargeJob = require('../../../../src/modules/billing/jobs/create-charge');

// Connectors
const chargeModuleTransactions = require('../../../../src/lib/connectors/charge-module/transactions');
const repos = require('../../../../src/lib/connectors/repository');

// Services
const batchService = require('../../../../src/modules/billing/services/batch-service');
const chargeElementsService = require('../../../../src/modules/billing/services/charge-elements-service');
const invoiceLicencesService = require('../../../../src/modules/billing/services/invoice-licences-service');
const invoiceService = require('../../../../src/modules/billing/services/invoice-service');
const transactionService = require('../../../../src/modules/billing/services/transactions-service');

// Models
const Batch = require('../../../../src/lib/models/batch');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Invoice = require('../../../../src/lib/models/invoice');
const Transaction = require('../../../../src/lib/models/transaction');

const transactionId = '46e5c0f1-ad0c-4274-8abd-8b8837ee473a';

const data = {
  eventId: 'test-event-id',
  batch: {
    billing_batch_id: 'test-batch-id'
  },
  transaction: {
    billing_transaction_id: transactionId,
    charge_element_id: 'test-charge-element-id'
  },
  models: {
    batch: new Batch(),
    chargeElement: new ChargeElement(),
    invoiceLicence: new InvoiceLicence(),
    invoice: new Invoice(),
    transaction: new Transaction(transactionId)
  },
  chargeModuleTransaction: {
    periodStart: '01-APR-2019',
    periodEnd: '31-MAR-2020',
    credit: false,
    billableDays: 366,
    authorisedDays: 366,
    volume: 5.64,
    twoPartTariff: false,
    compensationCharge: false,
    section126Factor: 1,
    section127Agreement: false,
    section130Agreement: false,
    customerReference: 'A12345678A',
    lineDescription: 'Tiny pond',
    chargePeriod: '01-APR-2019 - 31-MAR-2020',
    batchNumber: 'd65bf89e-4a84-4f2e-8fc1-ebc5ff08c125',
    source: 'Supported',
    season: 'Summer',
    loss: 'Low',
    eiucSource: 'Other',
    chargeElementId: '29328315-9b24-473b-bde7-02c60e881501',
    waterUndertaker: true,
    regionalChargingArea: 'Anglian',
    licenceNumber: '01/123/ABC',
    region: 'A',
    areaCode: 'ARCA'
  },
  chargeModuleResponse: {
    transaction: {
      id: 'd091a865-073c-4eb0-8e82-37c9a421ed68'
    }
  }
};

experiment('modules/billing/jobs/create-charge', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');

    sandbox.stub(batchService, 'mapDBToModel').returns(data.models.batch);
    sandbox.stub(chargeElementsService, 'getById').resolves(data.models.chargeElement);
    sandbox.stub(invoiceLicencesService, 'getByTransactionId').resolves(data.models.invoiceLicence);
    sandbox.stub(invoiceService, 'getByTransactionId').resolves(data.models.invoice);
    sandbox.stub(transactionService, 'mapDBToModel').returns(data.models.transaction);
    sandbox.stub(transactionService, 'mapModelToChargeModule').returns(data.chargeModuleTransaction);
    sandbox.stub(chargeModuleTransactions, 'createTransaction').resolves(data.chargeModuleResponse);
    sandbox.stub(repos.billingTransactions, 'setStatus');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(createChargeJob.jobName).to.equal('billing.create-charge');
  });

  experiment('.createMessage', () => {
    test('creates the expected message object', async () => {
      const message = createChargeJob.createMessage(
        data.eventId,
        data.batch,
        data.transaction
      );

      expect(message).to.equal({
        name: 'billing.create-charge',
        data: {
          eventId: data.eventId,
          batch: data.batch,
          transaction: data.transaction
        }
      });
    });
  });

  experiment('.handler', () => {
    let result, job;

    beforeEach(async () => {
      job = {
        data: {
          batch: data.batch,
          transaction: data.transaction
        }
      };
    });

    experiment('when there is no error', () => {
      beforeEach(async () => {
        result = await createChargeJob.handler(job);
      });

      test('charge element is loaded with charge element ID from transaction', async () => {
        const [id] = chargeElementsService.getById.lastCall.args;
        expect(id).to.equal(job.data.transaction.charge_element_id);
      });

      test('invoice licence is loaded with transaction ID from transaction', async () => {
        const [id] = invoiceLicencesService.getByTransactionId.lastCall.args;
        expect(id).to.equal(job.data.transaction.billing_transaction_id);
      });

      test('invoice is loaded by transaction ID from transaction', async () => {
        const [id] = invoiceService.getByTransactionId.lastCall.args;
        expect(id).to.equal(job.data.transaction.billing_transaction_id);
      });

      test('transaction is mapped from transaction data in job', async () => {
        const [data] = transactionService.mapDBToModel.lastCall.args;
        expect(data).to.equal(job.data.transaction);
      });

      test('batch is mapped from batch data in job', async () => {
        const [data] = batchService.mapDBToModel.lastCall.args;
        expect(data).to.equal(job.data.batch);
      });

      test('the correct models are mapped to a charge module payload', async () => {
        const [batch, invoice, invoiceLicence, transaction] = transactionService.mapModelToChargeModule.lastCall.args;
        expect(batch).to.equal(data.models.batch);
        expect(invoice).to.equal(data.models.invoice);
        expect(invoiceLicence).to.equal(data.models.invoiceLicence);
        expect(transaction).to.equal(data.models.transaction);
      });

      test('the charge module payload is sent to the .createTransaction connector', async () => {
        const [payload] = chargeModuleTransactions.createTransaction.lastCall.args;
        expect(payload).to.equal(data.chargeModuleTransaction);
      });

      test('the water.billing_transactions status is updated', async () => {
        const [id, status, externalId] = repos.billingTransactions.setStatus.lastCall.args;
        expect(id).to.equal(data.transaction.billing_transaction_id);
        expect(status).to.equal('charge_created');
        expect(externalId).to.equal(data.chargeModuleResponse.transaction.id);
      });

      test('returns the batch', async () => {
        expect(result).to.equal({
          batch: job.data.batch
        });
      });
    });

    experiment('when there is an error', () => {
      const err = new Error('Test error');

      beforeEach(async () => {
        chargeModuleTransactions.createTransaction.rejects(err);
      });

      test('logs an error', async () => {
        try {
          result = await createChargeJob.handler(job);
          fail();
        } catch (error) {
          const { args } = logger.error.lastCall;

          expect(args[0]).to.equal('billing.create-charge error');
          expect(args[1]).to.equal(err);
          expect(args[2]).to.equal({
            batch_id: data.batch.billing_batch_id,
            transaction_id: data.transaction.billing_transaction_id
          });
        }
      });

      test('sets the transaction status to error', async () => {
        try {
          result = await createChargeJob.handler(job);
          fail();
        } catch (error) {
          const [id, status] = repos.billingTransactions.setStatus.lastCall.args;
          expect(id).to.equal(data.transaction.billing_transaction_id);
          expect(status).to.equal('error');
        }
      });

      test('re-throws the error', async () => {
        try {
          result = await createChargeJob.handler(job);
          fail();
        } catch (error) {
          expect(error).to.equal(err);
        }
      });
    });
  });
});
