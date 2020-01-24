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

  experiment('.setStatus', () => {
    test('updates by billing_batch_charge_version_year_id', async () => {
      const repo = new BillingBatchChargeVersionYearsRepository();
      await repo.setStatus('test-id', 'complete');

      const [filter] = repo.update.lastCall.args;

      expect(filter).to.equal({
        billing_batch_charge_version_year_id: 'test-id'
      });
    });

    test('updates the status', async () => {
      const repo = new BillingBatchChargeVersionYearsRepository();
      await repo.setStatus('test-id', 'complete');

      const [, newData] = repo.update.lastCall.args;

      expect(newData.status).to.equal('complete');
      expect(newData.date_updated).to.be.a.date();
    });
  });

  experiment('.findProcessingByBatch', () => {
    test('searches by billing_batch_id', async () => {
      const repo = new BillingBatchChargeVersionYearsRepository();
      await repo.findProcessingByBatch('test-id');

      const [filter] = repo.find.lastCall.args;

      expect(filter.billing_batch_id).to.equal('test-id');
    });

    test('searches by using the processing status', async () => {
      const repo = new BillingBatchChargeVersionYearsRepository();
      await repo.findProcessingByBatch('test-id');

      const [filter] = repo.find.lastCall.args;

      expect(filter.status).to.equal('processing');
    });
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
