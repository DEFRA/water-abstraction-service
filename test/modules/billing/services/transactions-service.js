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
const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');
const repos = require('../../../../src/lib/connectors/repos');
const { logger } = require('../../../../src/logger');

const { createTransaction, createInvoiceLicence, createTransactionDBRow, createBillingVolumeDBRow } = require('../test-data/test-billing-data');
const { NotFoundError } = require('../../../../src/lib/errors');

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
const transactionDBRow = createTransactionDBRow({ chargeElement: chargeElementDBData });

experiment('modules/billing/services/transactions-service', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingTransactions, 'create');
    sandbox.stub(repos.billingTransactions, 'update').resolves(transactionDBRow);
    sandbox.stub(repos.billingTransactions, 'delete');
    sandbox.stub(repos.billingTransactions, 'findByBatchId');

    sandbox.stub(billingVolumesService, 'getVolumesForBatch');

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

  experiment('.updateTransactionVolumes', () => {
    let transactions, billingVolumes;
    const chargeElementId1 = uuid();
    const chargeElementId2 = uuid();
    const batch = { id: uuid() };
    beforeEach(async () => {
      transactions = [
        createTransactionDBRow({ id: uuid(), chargeElementId: chargeElementId1 }),
        createTransactionDBRow({ id: uuid(), chargeElementId: chargeElementId2 }),
        createTransactionDBRow({ id: uuid() })
      ];
      billingVolumes = [
        createBillingVolumeDBRow({ billingVolumeId: uuid(), chargeElementId: chargeElementId1, volume: 5.325 }),
        createBillingVolumeDBRow({ billingVolumeId: uuid(), chargeElementId: chargeElementId2, volume: 32.7 })
      ];
      repos.billingTransactions.findByBatchId.resolves(transactions);
      billingVolumesService.getVolumesForBatch.resolves(billingVolumes);
    });

    experiment('when all billing volumes have corresponding transactions', () => {
      beforeEach(async () => {
        await transactionsService.updateTransactionVolumes(batch);
      });
      test('calls transactions repo.findByBatchId', async () => {
        expect(repos.billingTransactions.findByBatchId.calledWith(
          batch.id
        )).to.be.true();
      });

      test('calls billingVolumesService to get the volumes for the batch', async () => {
        expect(billingVolumesService.getVolumesForBatch.calledWith(
          batch
        )).to.be.true();
      });

      test('matches the first billingVolume to relevant transaction', async () => {
        const [transactionId, changes] = repos.billingTransactions.update.firstCall.args;
        expect(transactionId).to.equal(transactions[0].billingTransactionId);
        expect(changes).to.equal({ volume: billingVolumes[0].volume });
      });

      test('matches the second billingVolume to relevant transaction', async () => {
        const [transactionId, changes] = repos.billingTransactions.update.secondCall.args;
        expect(transactionId).to.equal(transactions[1].billingTransactionId);
        expect(changes).to.equal({ volume: billingVolumes[1].volume });
      });

      test('does not update transaction without a matching billing volume', async () => {
        expect(repos.billingTransactions.update.thirdCall).to.be.null();
      });
    });

    experiment('when these is a missing transaction', () => {
      test('a NotFoundError is thrown', async () => {
        const unmatcheBillingVolume = createBillingVolumeDBRow({ billingVolumeId: uuid(), volume: 16.5 });

        try {
          billingVolumesService.getVolumesForBatch.resolves([
            ...billingVolumes,
            unmatcheBillingVolume
          ]);
          await transactionsService.updateTransactionVolumes(batch);
        } catch (err) {
          expect(err).to.be.instanceOf(NotFoundError);
          expect(err.message).to.equal(`No transaction found for billing volume ${unmatcheBillingVolume.billingVolumeId}`);
        }
      });
    });
  });
});
