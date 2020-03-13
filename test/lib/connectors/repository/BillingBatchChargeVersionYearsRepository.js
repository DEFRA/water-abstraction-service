const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const BillingBatchChargeVersionYearsRepository = require('../../../../src/lib/connectors/repository/BillingBatchChargeVersionYearsRepository');

experiment('lib/connectors/repository/BillingBatchChargeVersionYearsRepository', () => {
  beforeEach(async () => {
    sandbox.stub(BillingBatchChargeVersionYearsRepository.prototype, 'find');
    sandbox.stub(BillingBatchChargeVersionYearsRepository.prototype, 'update');
    sandbox.stub(BillingBatchChargeVersionYearsRepository.prototype, 'delete');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.deleteByBatchId', () => {
    test('calls delete with the expected filter', async () => {
      const repo = new BillingBatchChargeVersionYearsRepository();
      await repo.deleteByBatchId('test-id');

      const [filter] = repo.delete.lastCall.args;

      expect(filter).to.equal({
        billing_batch_id: 'test-id'
      });
    });
  });
});
