'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const batches = require('../../../../src/modules/acceptance-tests/lib/batches');
const { pool } = require('../../../../src/lib/connectors/db');
const newRepos = require('../../../../src/lib/connectors/repos');

experiment('modules/acceptance-tests/batches', () => {
  beforeEach(async () => {
    sandbox.stub(pool, 'query');

    sandbox.stub(newRepos.billingBatchChargeVersionYears, 'deleteByBatchId').resolves();
    sandbox.stub(newRepos.billingBatchChargeVersions, 'deleteByBatchId').resolves();
    sandbox.stub(newRepos.billingVolumes, 'deleteByBatchId').resolves();
    sandbox.stub(newRepos.billingTransactions, 'deleteByBatchId').resolves();
    sandbox.stub(newRepos.billingInvoiceLicences, 'deleteByBatchId').resolves();
    sandbox.stub(newRepos.billingInvoices, 'deleteByBatchId').resolves();
    sandbox.stub(newRepos.billingBatches, 'delete').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.delete', () => {
    beforeEach(async () => {
      pool.query.onFirstCall().resolves({
        rows: [
          { billing_batch_id: null },
          { billing_batch_id: '00000000-0000-0000-0000-000000000000' }
        ]
      });

      pool.query.onSecondCall().resolves({
        rows: [
          { billing_batch_id: '00000000-0000-0000-0000-000000000000' },
          { billing_batch_id: '11111111-1111-1111-1111-111111111111' }
        ]
      });

      pool.query.resolves();

      await batches.delete();
    });

    test('deletes the batches using the unique ids', async () => {
      expect(newRepos.billingBatchChargeVersionYears.deleteByBatchId.callCount).to.equal(2);
      expect(newRepos.billingBatchChargeVersionYears.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000', false)).to.be.true();
      expect(newRepos.billingBatchChargeVersionYears.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111', false)).to.be.true();

      expect(newRepos.billingBatchChargeVersions.deleteByBatchId.callCount).to.equal(2);
      expect(newRepos.billingBatchChargeVersions.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000', false)).to.be.true();
      expect(newRepos.billingBatchChargeVersions.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111', false)).to.be.true();

      expect(newRepos.billingVolumes.deleteByBatchId.callCount).to.equal(2);
      expect(newRepos.billingVolumes.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(newRepos.billingVolumes.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();

      expect(newRepos.billingTransactions.deleteByBatchId.callCount).to.equal(2);
      expect(newRepos.billingTransactions.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(newRepos.billingTransactions.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();

      expect(newRepos.billingInvoiceLicences.deleteByBatchId.callCount).to.equal(2);
      expect(newRepos.billingInvoiceLicences.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(newRepos.billingInvoiceLicences.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();

      expect(newRepos.billingInvoices.deleteByBatchId.callCount).to.equal(2);
      expect(newRepos.billingInvoices.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000', false)).to.be.true();
      expect(newRepos.billingInvoices.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111', false)).to.be.true();

      expect(newRepos.billingBatches.delete.callCount).to.equal(2);
      expect(newRepos.billingBatches.delete.calledWith('00000000-0000-0000-0000-000000000000', false)).to.be.true();
      expect(newRepos.billingBatches.delete.calledWith('11111111-1111-1111-1111-111111111111', false)).to.be.true();
    });
  });
});
