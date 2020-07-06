'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const chargeModuleBillRunConnector = require('../../../../../src/lib/connectors/charge-module/bill-runs');
const transactionsService = require('../../../../../src/modules/billing/services/transactions-service');
const createChargeProcessor = require('../../../../../src/modules/billing/bull-jobs/create-charge/processor');
const { logger } = require('../../../../../src/logger');

const sandbox = require('sinon').createSandbox();

const { createBatch } = require('../helpers');

experiment('modules/billing/bull-jobs/create-charge/processor.js', () => {
  let batch, batchId, job, cmResponse, transactionId;

  beforeEach(async () => {
    transactionId = uuid();
    batchId = uuid();

    job = {
      id: 'test-job-id',
      data: {
        batch: {
          id: batchId,
          externalId: uuid()
        },
        transaction: {
          billingTransactionId: transactionId
        }
      }
    };

    cmResponse = {
      transaction: {
        id: uuid()
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(chargeModuleBillRunConnector, 'addTransaction').resolves(cmResponse);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the transaction is a candidate', () => {
    beforeEach(async () => {
      batch = createBatch(batchId, transactionId);
      sandbox.stub(transactionsService, 'getById').resolves(batch);
      sandbox.stub(transactionsService, 'updateWithChargeModuleResponse').resolves(batch);
      await createChargeProcessor(job);
    });

    test('a message is logged', async () => {
      const [message] = logger.info.lastCall.args;
      expect(message).to.equal('Handling: test-job-id');
    });

    test('the transaction is loaded within the context of its batch', async () => {
      expect(transactionsService.getById.calledWith(transactionId)).to.be.true();
    });

    test('the transaction is added in the CM', async () => {
      const [externalId, cmTransaction] = chargeModuleBillRunConnector.addTransaction.lastCall.args;
      expect(externalId).to.equal(batch.externalId);
      expect(cmTransaction).to.be.an.object();
    });

    test('the transaction is updated with the CM response', async () => {
      expect(transactionsService.updateWithChargeModuleResponse.calledWith(
        transactionId, cmResponse
      )).to.be.true();
    });
  });

  experiment('when the transaction is not a candidate', () => {
    beforeEach(async () => {
      batch = createBatch(batchId, transactionId, 'charge_created');
      sandbox.stub(transactionsService, 'getById').resolves(batch);
      sandbox.stub(transactionsService, 'updateWithChargeModuleResponse').resolves(batch);
      await createChargeProcessor(job);
    });

    test('a message is logged', async () => {
      const [message] = logger.info.lastCall.args;
      expect(message).to.equal('Info: test-job-id Transaction already processed');
    });

    test('the transaction is loaded within the context of its batch', async () => {
      expect(transactionsService.getById.calledWith(transactionId)).to.be.true();
    });

    test('the transaction is not added in the CM', async () => {
      expect(chargeModuleBillRunConnector.addTransaction.called).to.be.false();
    });
  });
});
