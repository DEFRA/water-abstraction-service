const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const BillingTransactionRepository = require('../../../../src/lib/connectors/repository/BillingTransactionRepository');

experiment('lib/connectors/repository/BillingTransactionRepository', () => {
  beforeEach(async () => {
    sandbox.stub(BillingTransactionRepository.prototype, 'dbQuery').resolves();
    sandbox.stub(BillingTransactionRepository.prototype, 'update').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getByBatchId', () => {
    let result;

    beforeEach(async () => {
      BillingTransactionRepository.prototype.dbQuery.resolves({
        rows: []
      });
      const repo = new BillingTransactionRepository();
      result = await repo.getByBatchId('test-batch-id');
    });

    test('calls .dbQuery with correct params', async () => {
      const [query, params] = BillingTransactionRepository.prototype.dbQuery.lastCall.args;
      expect(query).to.equal(BillingTransactionRepository._getByBatchIdQuery);
      expect(params).to.equal(['test-batch-id']);
    });

    test('resolves with an array of rows', async () => {
      expect(result).to.be.an.array();
    });
  });

  experiment('.setStatus', () => {
    let repo;

    beforeEach(async () => {
      repo = new BillingTransactionRepository();
    });

    experiment('when a charge module ID is supplied', () => {
      beforeEach(async () => {
        await repo.setStatus('test-id', 'charge_created', 'charge-module-id');
      });

      test('the row to update is found with the correct filter', async () => {
        const [filter] = BillingTransactionRepository.prototype.update.lastCall.args;
        expect(filter).to.equal({
          billing_transaction_id: 'test-id'
        });
      });

      test('the status and external ID are updated', async () => {
        const [, data] = BillingTransactionRepository.prototype.update.lastCall.args;
        expect(data).to.equal({
          status: 'charge_created',
          external_id: 'charge-module-id'
        });
      });
    });

    experiment('when a charge module ID is not supplied', () => {
      beforeEach(async () => {
        await repo.setStatus('test-id', 'charge_created');
      });

      test('the row to update is found with the correct filter', async () => {
        const [filter] = BillingTransactionRepository.prototype.update.lastCall.args;
        expect(filter).to.equal({
          billing_transaction_id: 'test-id'
        });
      });

      test('the status only is updated', async () => {
        const [, data] = BillingTransactionRepository.prototype.update.lastCall.args;
        expect(data).to.equal({
          status: 'charge_created'
        });
      });
    });
  });
});
