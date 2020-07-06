'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const { logger } = require('../../../../../src/logger');
const Batch = require('../../../../../src/lib/models/batch');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const transactionsService = require('../../../../../src/modules/billing/services/transactions-service');
const supplementaryBillingService = require('../../../../../src/modules/billing/services/supplementary-billing-service');
const billingVolumesService = require('../../../../../src/modules/billing/services/billing-volumes-service');
const repos = require('../../../../../src/lib/connectors/repos');

const prepareTransactionsProcessor = require('../../../../../src/modules/billing/bull-jobs/prepare-transactions/processor');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('modules/billing/bull-jobs/prepare-transactions/processor', () => {
  let batch, job, batchId, result;

  beforeEach(async () => {
    batchId = uuid();
    batch = new Batch(batchId);

    job = {
      id: 'test-job-id',
      data: {
        batch: {
          id: batchId
        }
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(billingVolumesService, 'getVolumesForBatch').resolves([]);
    sandbox.stub(transactionsService, 'updateTransactionVolumes');
    sandbox.stub(supplementaryBillingService, 'processBatch');
    sandbox.stub(repos.billingTransactions, 'findByBatchId').resolves([{
      billingTransactionId: 'test-transaction-id'
    }]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when there are no billing volumes to update', () => {
    experiment('when the batch is not supplementary', () => {
      beforeEach(async () => {
        result = await prepareTransactionsProcessor(job);
      });

      test('a message is logged', async () => {
        const [message] = logger.info.lastCall.args;
        expect(message).to.equal('Handling: test-job-id');
      });

      test('the batch is loaded', async () => {
        expect(batchService.getBatchById.calledWith(
          job.data.batch.id
        )).to.be.true();
      });

      test('the transaction volumes are not updated', async () => {
        expect(transactionsService.updateTransactionVolumes.called).to.be.false();
      });

      test('the supplementary processing is not invoked', async () => {
        expect(supplementaryBillingService.processBatch.called).to.be.false();
      });

      test('the transactions are loaded from the repo', async () => {
        expect(repos.billingTransactions.findByBatchId.calledWith(
          batchId
        )).to.be.true();
      });

      test('resolves with the batch and transactions', async () => {
        expect(result.batch).to.equal(batch);
        expect(result.transactions[0].billingTransactionId).to.equal('test-transaction-id');
      });
    });

    experiment('when the batch is supplementary', () => {
      beforeEach(async () => {
        batch.type = 'supplementary';
        result = await prepareTransactionsProcessor(job);
      });

      test('a message is logged', async () => {
        const [message] = logger.info.lastCall.args;
        expect(message).to.equal('Info: test-job-id Processing supplementary transactions');
      });

      test('the supplementary processing is invoked with the batch ID', async () => {
        expect(supplementaryBillingService.processBatch.calledWith(
          batchId
        )).to.be.true();
      });
    });
  });

  experiment('when there are billing volumes to update', () => {
    beforeEach(async () => {
      billingVolumesService.getVolumesForBatch.resolves([
        {
          billingVolumeId: 'test-billing-volume-id'
        }
      ]);
      result = await prepareTransactionsProcessor(job);
    });

    test('the transaction volumes are updated', async () => {
      expect(transactionsService.updateTransactionVolumes.calledWith(
        batch
      )).to.be.true();
    });
  });
});
