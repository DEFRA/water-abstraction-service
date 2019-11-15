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
      await repo.createBatch('region-id', 'annual', 2019, 'summer');

      const [, params] = BillingBatchRepository.prototype.dbQuery.lastCall.args;
      const [regionId, batchType, financialYear, season] = params;

      expect(params).to.have.length(4);
      expect(regionId).to.equal('region-id');
      expect(batchType).to.equal('annual');
      expect(financialYear).to.equal(2019);
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
});
