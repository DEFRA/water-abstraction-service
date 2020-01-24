const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const BillingBatchRepository = require('../../../../src/lib/connectors/repository/BillingBatchRepository');

experiment('lib/connectors/repository/BillingBatchRepository', () => {
  beforeEach(async () => {
    sandbox.stub(BillingBatchRepository.prototype, 'dbQuery');
    sandbox.stub(BillingBatchRepository.prototype, 'update').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createBatch', () => {
    test('returns null if no rows returned', async () => {
      BillingBatchRepository.prototype.dbQuery.resolves({
        rows: []
      });

      const repo = new BillingBatchRepository();
      const result = await repo.createBatch('region-id', 'annual', 2019, 'summer');
      expect(result).to.be.null();
    });

    test('returns the first item if rows are returned', async () => {
      BillingBatchRepository.prototype.dbQuery.resolves({
        rows: [1]
      });

      const repo = new BillingBatchRepository();
      const result = await repo.createBatch('region-id', 'annual', 2019, 'summer');
      expect(result).to.equal(1);
    });

    test('forwards the expected params to the query', async () => {
      const repo = new BillingBatchRepository();
      await repo.createBatch('region-id', 'supplementary', 2013, 2019, 'summer');

      const [, params] = BillingBatchRepository.prototype.dbQuery.lastCall.args;
      const [regionId, batchType, fromFinancialYearEnding, toFinancialYearEnding, season] = params;

      expect(params).to.have.length(5);
      expect(regionId).to.equal('region-id');
      expect(batchType).to.equal('supplementary');
      expect(fromFinancialYearEnding).to.equal(2013);
      expect(toFinancialYearEnding).to.equal(2019);
      expect(season).to.equal('summer');
    });
  });

  experiment('.getById', () => {
    test('returns null if no rows returned', async () => {
      BillingBatchRepository.prototype.dbQuery.resolves({
        rows: []
      });

      const repo = new BillingBatchRepository();
      const result = await repo.getById('batch-id');
      expect(result).to.be.null();
    });

    test('returns the first item if rows are returned', async () => {
      BillingBatchRepository.prototype.dbQuery.resolves({
        rows: [1]
      });

      const repo = new BillingBatchRepository();
      const result = await repo.getById('batch-id');
      expect(result).to.equal(1);
    });
  });

  experiment('.setStatus', () => {
    test('updates by billing_batch_id', async () => {
      const repo = new BillingBatchRepository();
      await repo.setStatus('test-batch-id', 'complete');

      const [filter] = repo.update.lastCall.args;

      expect(filter).to.equal({
        billing_batch_id: 'test-batch-id'
      });
    });

    test('updates the status', async () => {
      const repo = new BillingBatchRepository();
      await repo.setStatus('test-batch-id', 'complete');

      const [, newData] = repo.update.lastCall.args;

      expect(newData.status).to.equal('complete');
      expect(newData.date_updated).to.be.a.date();
    });
  });

  experiment('.deleteByBatchId', () => {
    beforeEach(async () => {
      const repo = new BillingBatchRepository();
      await repo.deleteByBatchId('test-batch-id');
    });

    test('passes the expected parameters to the query', async () => {
      const [, params] = BillingBatchRepository.prototype.dbQuery.lastCall.args;
      expect(params).to.have.length(1);
      expect(params[0]).to.equal('test-batch-id');
    });
  });
});
