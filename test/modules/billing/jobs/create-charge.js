'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const createChargeJob = require('../../../../src/modules/billing/jobs/create-charge');

// Connectors
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs');
const mappers = require('../../../../src/modules/billing/mappers');

// Services
const transactionService = require('../../../../src/modules/billing/services/transactions-service');

// Models
const Batch = require('../../../../src/lib/models/batch');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Invoice = require('../../../../src/lib/models/invoice');
const Transaction = require('../../../../src/lib/models/transaction');

const transactionId = uuid();
const batchId = uuid();
const chargeModuleBillRunId = uuid();

const data = {
  eventId: 'test-event-id',
  batch: {
    id: batchId,
    externalId: chargeModuleBillRunId
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
  let batch;

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingError');

    batch = new Batch();
    batch.fromHash(data.batch);

    sandbox.stub(transactionService, 'getById').resolves(batch);
    sandbox.stub(transactionService, 'updateWithChargeModuleResponse').resolves();
    sandbox.stub(transactionService, 'setErrorStatus').resolves();

    sandbox.stub(chargeModuleBillRunConnector, 'addTransaction').resolves(data.chargeModuleResponse);
    sandbox.stub(mappers.batch, 'modelToChargeModule').returns([data.chargeModuleTransaction]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(createChargeJob.jobName).to.equal('billing.create-charge.*');
  });

  experiment('.createMessage', () => {
    test('creates the expected message object', async () => {
      const message = createChargeJob.createMessage(
        data.eventId,
        data.batch,
        data.transaction
      );

      expect(message).to.equal({
        name: `billing.create-charge.${batchId}`,
        data: {
          eventId: data.eventId,
          batch: data.batch,
          transaction: data.transaction
        },
        options: {
          singletonKey: transactionId
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
        },
        name: 'billing.create-charge.test-batch-id'
      };
    });

    experiment('when there is no error', () => {
      beforeEach(async () => {
        result = await createChargeJob.handler(job);
      });

      test('the transaction is loaded within the context of its batch', async () => {
        const [id] = transactionService.getById.lastCall.args;
        expect(id).to.equal(job.data.transaction.billing_transaction_id);
      });

      test('the batch is mapped to charge module transactions', async () => {
        const { args } = mappers.batch.modelToChargeModule.lastCall;
        expect(args[0]).to.equal(batch);
      });

      test('the charge module payload is sent to the .createTransaction connector', async () => {
        const [externalId, payload] = chargeModuleBillRunConnector.addTransaction.lastCall.args;
        expect(externalId).to.equal(data.batch.externalId);
        expect(payload).to.equal(data.chargeModuleTransaction);
      });

      test('the transaction is updated with the charge module response', async () => {
        const [id, response] = transactionService.updateWithChargeModuleResponse.lastCall.args;
        expect(id).to.equal(transactionId);
        expect(response).to.equal(data.chargeModuleResponse);
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
        chargeModuleBillRunConnector.addTransaction.rejects(err);
      });

      test('logs an error', async () => {
        try {
          result = await createChargeJob.handler(job);
          fail();
        } catch (error) {
          const { args } = batchJob.logHandlingError.lastCall;

          expect(args[0]).to.equal(job);
          expect(args[1]).to.equal(err);
        }
      });

      test('sets the transaction status to error', async () => {
        try {
          result = await createChargeJob.handler(job);
          fail();
        } catch (error) {
          const [id] = transactionService.setErrorStatus.lastCall.args;
          expect(id).to.equal(data.transaction.billing_transaction_id);
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
