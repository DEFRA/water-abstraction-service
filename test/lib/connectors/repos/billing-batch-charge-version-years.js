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
      save: sandbox.stub().resolves(model)
    };
    sandbox.stub(BillingBatchChargeVersionYear, 'forge').returns(stub);
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
});
