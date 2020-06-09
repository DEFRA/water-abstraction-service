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
const uuid = require('uuid/v4');

const transactionsService = require('../../../../src/modules/billing/services/transactions-service');
const repos = require('../../../../src/lib/connectors/repos');
const { logger } = require('../../../../src/logger');
const { BATCH_TYPE, BATCH_STATUS } = require('../../../../src/lib/models/batch');
const Transaction = require('../../../../src/lib/models/transaction');
const { BatchStatusError, TransactionStatusError } = require('../../../../src/modules/billing/lib/errors');

const { createTransaction, createInvoiceLicence, createBatch } = require('../test-data/test-billing-data');

const chargeElementDBData = {
  chargeElementId: 'ae7197b3-a00b-4a49-be36-af63df6f8583',
  source: 'unsupported',
  season: 'winter',
  loss: 'medium',
  abstractionPeriodStartDay: 1,
  abstractionPeriodStartMonth: 4,
  abstractionPeriodEndDay: 31,
  abstractionPeriodEndMonth: 3,
  authorisedAnnualQuantity: 20
};
const transactionDBRow = {
  billingTransactionId: '56bee20e-d65e-4110-bf35-5681e2c73d66',
  status: 'candidate',
  startDate: '2019-04-01',
  endDate: '2020-03-31',
  chargeType: 'standard',
  chargeElement: chargeElementDBData,
  volume: 5.64,
  twoPartTariffStatus: null,
  twoPartTariffError: false,
  twoPartTariffReview: {
    id: 1234,
    email: 'test@example.com'
  },
  section126Factor: null,
  section127Agreement: true,
  section130Agreement: false
};
experiment('modules/billing/services/transactions-service', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingTransactions, 'create');
    sandbox.stub(repos.billingTransactions, 'update').resolves(transactionDBRow);
    sandbox.stub(repos.billingTransactions, 'delete');

    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.saveTransactionToDB', () => {
    let invoiceLicence;

    beforeEach(async () => {
      invoiceLicence = createInvoiceLicence({ transactions: [createTransaction()] });
      await transactionsService.saveTransactionToDB(invoiceLicence, invoiceLicence.transactions[0]);
    });

    test('the create() method is called on the repo', async () => {
      expect(repos.billingTransactions.create.called).to.be.true();
    });

    test('an object of the correct shape is passed to the create() method of the repo', async () => {
      const [data] = repos.billingTransactions.create.lastCall.args;
      expect(data).to.be.an.object();
      expect(Object.keys(data)).to.include([
        'billingInvoiceLicenceId',
        'chargeElementId',
        'startDate',
        'endDate',
        'abstractionPeriod',
        'source',
        'season',
        'loss',
        'isCredit',
        'chargeType',
        'authorisedQuantity',
        'billableQuantity',
        'authorisedDays',
        'billableDays',
        'description'
      ]);
    });
  });

  experiment('.updateTransactionWithChargeModuleResponse', () => {
    const transactionId = uuid();
    const externalId = uuid();

    experiment('when there is a transaction ID', () => {
      beforeEach(async () => {
        await transactionsService.updateWithChargeModuleResponse(transactionId, {
          transaction: {
            id: externalId
          }
        });
      });

      test('the transaction status and external ID are updated', async () => {
        const [id, changes] = repos.billingTransactions.update.lastCall.args;
        expect(id).to.equal(transactionId);
        expect(changes).to.equal({
          externalId,
          status: 'charge_created'
        });
      });
    });

    experiment('when there is a zero charge response', () => {
      beforeEach(async () => {
        await transactionsService.updateWithChargeModuleResponse(transactionId, {
          status: 'Zero value charge calculated'
        });
      });

      test('the transaction is deleted', async () => {
        const [id] = repos.billingTransactions.delete.lastCall.args;
        expect(id).to.equal(transactionId);
      });
    });

    experiment('when there is an unrecognised response', () => {
      const response = {
        message: 'Something strange'
      };

      test('throws an error', async () => {
        try {
          transactionsService.updateWithChargeModuleResponse(transactionId, response);
          fail();
        } catch (err) {
          expect(err instanceof Error).to.be.true();
        }
      });

      test('logs an error', async () => {
        try {
          transactionsService.updateWithChargeModuleResponse(transactionId, response);
          fail();
        } catch (err) {
          const [message, error, params] = logger.error.lastCall.args;
          expect(message).to.be.a.string();
          expect(error instanceof Error).to.be.true();
          expect(params).to.equal({
            transactionId,
            response
          });
        }
      });
    });
  });

  experiment('.updateTransactionVolume', () => {
    let batch, transaction, transactionId, result;

    beforeEach(async () => {
      repos.billingTransactions.update.resolves({ attributes: transactionDBRow });

      const options = {
        id: transactionId,
        status: Transaction.statuses.candidate
      };
      transaction = createTransaction(options);

      batch = createBatch({
        type: BATCH_TYPE.twoPartTariff,
        status: BATCH_STATUS.review
      });

      result = await transactionsService.updateTransactionVolume(batch, transaction, 5.64);
    });

    experiment('when all criteria for update is met', () => {
      test('the update() method is called on the repo', () => {
        expect(repos.billingTransactions.update.called).to.be.true();
      });

      test('the transaction volume, twoPartTariffError and twoPartTariffReview are updated', () => {
        const [id, changes] = repos.billingTransactions.update.lastCall.args;
        expect(id).to.equal(transactionId);
        expect(changes).to.equal({
          volume: 5.64
        });
      });

      experiment('the updated Transaction', () => {
        test('is a Transaction model', () => {
          expect(result).to.be.an.instanceOf(Transaction);
        });

        test('contains the updated volume', () => {
          expect(result.volume).to.equal(5.64);
        });
      });
    });

    experiment('when criteria for update is not met', () => {
      test('throws expected error when batch is the wrong type', async () => {
        batch.type = BATCH_TYPE.annual;
        try {
          await transactionsService.updateTransactionVolume(batch, transaction, 5.64);
        } catch (err) {
          expect(err).to.be.an.instanceOf(BatchStatusError);
          expect(err.name).to.equal('BatchStatusError');
          expect(err.message).to.equal('Batch type must be two part tariff');
        }
      });

      test('throws expected error when batch does not have review status', async () => {
        batch.status = BATCH_STATUS.processing;
        try {
          await transactionsService.updateTransactionVolume(batch, transaction, 5.64);
        } catch (err) {
          expect(err).to.be.an.instanceOf(BatchStatusError);
          expect(err.name).to.equal('BatchStatusError');
          expect(err.message).to.equal('Batch must have review status');
        }
      });

      test('throws expected error when transaction does not have candidate status', async () => {
        transaction.status = Transaction.statuses.chargeCreated;
        try {
          await transactionsService.updateTransactionVolume(batch, transaction, 5.64);
        } catch (err) {
          expect(err).to.be.an.instanceOf(TransactionStatusError);
          expect(err.name).to.equal('TransactionStatusError');
          expect(err.message).to.equal('Transaction must have candidate status');
        }
      });
    });
  });
});
