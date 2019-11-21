const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const repos = require('../../../../src/lib/connectors/repository');
const processChargeVersionsComplete = require('../../../../src/modules/billing/jobs/process-charge-versions-complete');

experiment('modules/billing/jobs/process-charge-versions-complete', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findProcessingByBatch').resolves({
      rowCount: 10
    });
    sandbox.stub(repos.billingBatches, 'setStatus').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('if there are more charge version years to process', () => {
    test('the batch status is not updated', async () => {
      await processChargeVersionsComplete({
        data: {
          response: {
            chargeVersionYear: {
              billing_batch_id: 'test-batch-id'
            }
          }
        }
      });

      expect(repos.billingBatchChargeVersionYears.findProcessingByBatch.calledWith('test-batch-id')).to.be.true();
      expect(repos.billingBatches.setStatus.called).to.be.false();
    });
  });

  experiment('if all the charge version years have been processed', () => {
    test('the batch status is updated', async () => {
      repos.billingBatchChargeVersionYears.findProcessingByBatch.resolves({
        rowCount: 0
      });

      await processChargeVersionsComplete({
        data: {
          response: {
            chargeVersionYear: {
              billing_batch_id: 'test-batch-id'
            }
          }
        }
      });

      expect(repos.billingBatchChargeVersionYears.findProcessingByBatch.calledWith('test-batch-id')).to.be.true();
      expect(repos.billingBatches.setStatus.calledWith('test-batch-id', 'complete')).to.be.true();
    });
  });
});
