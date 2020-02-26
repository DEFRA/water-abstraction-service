const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const BillingBatchChargeVersionsRepository = require('../../../../src/lib/connectors/repository/BillingBatchChargeVersionsRepository');

experiment('lib/connectors/repository/BillingBatchChargeVersionsRepository', () => {
  beforeEach(async () => {
    sandbox.stub(BillingBatchChargeVersionsRepository.prototype, 'delete');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.deleteByBatchId', () => {
    test('calls delete with the expected filter', async () => {
      const repo = new BillingBatchChargeVersionsRepository();
      await repo.deleteByBatchId('test-id');

      const [filter] = repo.delete.lastCall.args;

      expect(filter).to.equal({
        billing_batch_id: 'test-id'
      });
    });
  });
});
