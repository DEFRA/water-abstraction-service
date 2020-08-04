'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const repos = require('../../../../src/lib/connectors/repos');
const { BillingBatchChargeVersionYear, bookshelf } = require('../../../../src/lib/connectors/bookshelf');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-batch-charge-version-years');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');

experiment('lib/connectors/repos/billing-batch-charge-version-year', () => {
  let model, stub;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };
    stub = {
      save: sandbox.stub().resolves(model),
      destroy: sandbox.stub().resolves(),
      fetch: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis()
    };
    sandbox.stub(BillingBatchChargeVersionYear, 'forge').returns(stub);
    sandbox.stub(BillingBatchChargeVersionYear, 'collection').returns(stub);
    sandbox.stub(raw, 'multiRow');
    sandbox.stub(bookshelf.knex, 'raw');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.update', () => {
    const data = {
      status: 'complete'
    };
    const testId = 'test-id';
    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.update(testId, data);
    });

    test('calls model.forge with correct id', async () => {
      const [params] = BillingBatchChargeVersionYear.forge.lastCall.args;
      expect(params).to.equal({ billingBatchChargeVersionYearId: testId });
    });

    test('calls save() with the supplied data', async () => {
      const [params] = stub.save.lastCall.args;
      expect(params).to.equal(data);
    });
  });

  experiment('.findStatusCountsByBatchId', () => {
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.findStatusCountsByBatchId(batchId);
    });

    test('calls raw.multiRow with correct query and params', async () => {
      const [query, params] = raw.multiRow.lastCall.args;
      expect(query).to.equal(queries.findStatusCountsByBatchId);
      expect(params).to.equal({ batchId });
    });
  });

  experiment('.deleteByBatchId', () => {
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.deleteByBatchId(batchId);
    });

    test('calls forge() on the model', async () => {
      expect(BillingBatchChargeVersionYear.forge.called).to.be.true();
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
      await repos.billingBatchChargeVersionYears.deleteByBatchId(batchId, false);
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: false });
    });
  });

  experiment('.deleteByInvoiceId', () => {
    const billingInvoiceId = 'test-invoice-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.deleteByInvoiceId(billingInvoiceId);
    });

    test('calls knex.raw with correct query and params', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteByInvoiceId);
      expect(params).to.equal({ billingInvoiceId });
    });
  });

  experiment('.createForBatch', () => {
    const billingBatchId = 'test-invoice-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.createForBatch(billingBatchId);
    });

    test('calls knex.raw with correct query and params', async () => {
      const [query, params] = raw.multiRow.lastCall.args;
      expect(query).to.equal(queries.createForBatch);
      expect(params).to.equal({ billingBatchId });
    });
  });

  experiment('.findByBatchId', () => {
    const billingBatchId = 'test-batch-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.findByBatchId(billingBatchId);
    });

    test('calls Bookshelf methods in correct order', async () => {
      sinon.assert.callOrder(
        BillingBatchChargeVersionYear.collection,
        stub.where,
        stub.fetch,
        model.toJSON
      );
    });

    test('finds records with correct batch ID', async () => {
      expect(stub.where.calledWith('billing_batch_id', billingBatchId));
    });
  });

  experiment('.findTwoPartTariffByBatchId', () => {
    const billingBatchId = 'test-batch-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.findTwoPartTariffByBatchId(billingBatchId);
    });

    test('calls knex raw method with correct query', async () => {
      expect(bookshelf.knex.raw.calledWith(
        queries.findTwoPartTariffByBatchId, { billingBatchId }
      )).to.be.true();
    });
  });

  experiment('.deleteByBatchIdAndLicenceId', () => {
    const billingBatchId = 'test-batch-id';
    const licenceId = 'test-licence-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceId(billingBatchId, licenceId);
    });

    test('calls knex raw method with correct query', async () => {
      expect(bookshelf.knex.raw.calledWith(
        queries.deleteByBatchIdAndLicenceId, { billingBatchId, licenceId }
      )).to.be.true();
    });
  });
});
