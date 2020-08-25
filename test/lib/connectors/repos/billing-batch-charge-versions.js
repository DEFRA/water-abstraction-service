'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const billingBatchChargeVersions = require('../../../../src/lib/connectors/repos/billing-batch-charge-versions');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-batch-charge-versions');
const { BillingBatchChargeVersion, bookshelf } = require('../../../../src/lib/connectors/bookshelf');

const raw = require('../../../../src/lib/connectors/repos/lib/raw');

const response = [{
  billingBatchChargeVersionId: uuid(),
  chargeVersionId: uuid()
}];

experiment('lib/connectors/repos/billing-batch-charge-versions', () => {
  let stub, result;

  beforeEach(async () => {
    sandbox.stub(raw, 'multiRow').resolves(response);
    sandbox.stub(raw, 'singleRow').resolves(response[0]);

    stub = {
      destroy: sandbox.stub().resolves(),
      where: sandbox.stub().returnsThis()
    };
    sandbox.stub(BillingBatchChargeVersion, 'forge').returns(stub);
    sandbox.stub(bookshelf.knex, 'raw');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.deleteByBatchId', () => {
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      await billingBatchChargeVersions.deleteByBatchId(batchId);
    });

    test('calls forge() on the model', async () => {
      expect(BillingBatchChargeVersion.forge.called).to.be.true();
    });

    test('calls where() with the correct params', async () => {
      const [params] = stub.where.lastCall.args;
      expect(params).to.equal({ billing_batch_id: batchId });
    });

    test('calls destroy() to delete found records', async () => {
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: true });
    });

    test('when deletion is not required, calls destroy() with the correct params', async () => {
      await billingBatchChargeVersions.deleteByBatchId(batchId, false);
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: false });
    });
  });

  experiment('.deleteByBatchIdAndLicenceId', () => {
    const billingBatchId = 'test-batch-id';
    const licenceId = 'test-licence-id';

    beforeEach(async () => {
      await billingBatchChargeVersions.deleteByBatchIdAndLicenceId(billingBatchId, licenceId);
    });

    test('calls knex raw method with correct query', async () => {
      expect(bookshelf.knex.raw.calledWith(
        queries.deleteByBatchIdAndLicenceId, { billingBatchId, licenceId }
      )).to.be.true();
    });
  });

  experiment('.create', () => {
    const billingBatchId = 'test-batch-id';
    const chargeVersionId = 'test-charge-version-id';

    beforeEach(async () => {
      result = await billingBatchChargeVersions.create(billingBatchId, chargeVersionId);
    });

    test('calls raw.singleRow with correct query and params', async () => {
      const [query, params] = raw.singleRow.lastCall.args;
      expect(query).to.equal(queries.create);
      expect(params).to.equal({
        billingBatchId,
        chargeVersionId
      });
    });

    test('resolves with the saved row', async () => {
      expect(result).to.equal(response[0]);
    });
  });
});
