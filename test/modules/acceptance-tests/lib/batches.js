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
const repos = require('../../../../src/lib/connectors/repository');
const newRepos = require('../../../../src/lib/connectors/repos');

experiment('modules/acceptance-tests/batches', () => {
  beforeEach(async () => {
    sandbox.stub(pool, 'query');

    sandbox.stub(repos.billingBatchChargeVersionYears, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingBatchChargeVersions, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingTransactions, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingInvoiceLicences, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingInvoices, 'deleteByBatchId').resolves();
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
      expect(repos.billingBatchChargeVersionYears.deleteByBatchId.callCount).to.equal(2);
      expect(repos.billingBatchChargeVersionYears.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(repos.billingBatchChargeVersionYears.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();

      expect(repos.billingBatchChargeVersions.deleteByBatchId.callCount).to.equal(2);
      expect(repos.billingBatchChargeVersions.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(repos.billingBatchChargeVersions.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();

      expect(repos.billingTransactions.deleteByBatchId.callCount).to.equal(2);
      expect(repos.billingTransactions.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(repos.billingTransactions.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();

      expect(repos.billingInvoiceLicences.deleteByBatchId.callCount).to.equal(2);
      expect(repos.billingInvoiceLicences.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(repos.billingInvoiceLicences.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();

      expect(repos.billingInvoices.deleteByBatchId.callCount).to.equal(2);
      expect(repos.billingInvoices.deleteByBatchId.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(repos.billingInvoices.deleteByBatchId.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();

      expect(newRepos.billingBatches.delete.callCount).to.equal(2);
      expect(newRepos.billingBatches.delete.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
      expect(newRepos.billingBatches.delete.calledWith('11111111-1111-1111-1111-111111111111')).to.be.true();
    });
  });
});
