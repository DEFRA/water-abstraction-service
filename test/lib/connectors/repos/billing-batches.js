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

const billingBatches = require('../../../../src/lib/connectors/repos/billing-batches');
const { BillingBatch } = require('../../../../src/lib/connectors/bookshelf/');

experiment('lib/connectors/repos/billing-batches', () => {
  let model, stub;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' }),
      pagination: {
        rowCount: 53, // Total number of rows found for the query before pagination
        pageCount: 4, // Total number of pages of results
        page: 3, // The requested page number
        pageSize: 15 // The requested number of rows per page
      }
    };

    stub = {
      fetch: sandbox.stub().resolves(model),
      fetchAll: sandbox.stub().resolves(model),
      orderBy: sandbox.stub().returnsThis(),
      fetchPage: sandbox.stub().resolves(model),
      set: sandbox.stub().returnsThis(),
      where: sandbox.stub().returnsThis(),
      save: sandbox.stub().resolves(model),
      destroy: sandbox.spy()
    };
    sandbox.stub(BillingBatch, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    let result;

    beforeEach(async () => {
      result = await billingBatches.findOne('test-id');
    });

    test('calls model.forge with correct id', async () => {
      const [params] = BillingBatch.forge.lastCall.args;
      expect(params).to.equal({ billingBatchId: 'test-id' });
    });

    test('calls fetch() with related models', async () => {
      const [params] = stub.fetch.lastCall.args;
      expect(params.withRelated).to.equal(['region']);
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.findPage', () => {
    let result;

    beforeEach(async () => {
      result = await billingBatches.findPage(1, 10);
    });

    test('calls model.forge with no arguments', async () => {
      const { args } = BillingBatch.forge.lastCall;
      expect(args).to.equal([]);
    });

    test('calls orderBy to sort by date created descending', async () => {
      const [field, direction] = stub.orderBy.lastCall.args;
      expect(field).to.equal('date_created');
      expect(direction).to.equal('DESC');
    });

    test('calls fetchPage() with the expected params', async () => {
      const [options] = stub.fetchPage.lastCall.args;
      expect(options.page).to.equal(1);
      expect(options.pageSize).to.equal(10);
      expect(options.withRelated).to.equal(['region']);
    });

    test('resolves with a pagination envelope', async () => {
      expect(result.data).to.equal({ foo: 'bar' });
      expect(result.pagination).to.equal({
        page: 3,
        pageCount: 4,
        perPage: 15,
        totalRows: 53
      });
    });
  });

  experiment('.findByStatus', () => {
    beforeEach(async () => {
      await billingBatches.findByStatus('processing');
    });

    test('calls model.forge with no arguments', async () => {
      const { args } = BillingBatch.forge.lastCall;
      expect(args).to.equal([]);
    });

    test('calls where() to filter by status', async () => {
      const [params] = stub.where.lastCall.args;
      expect(params).to.equal({
        status: 'processing'
      });
    });

    test('calls fetchAll() with the relationships', async () => {
      const [options] = stub.fetchAll.lastCall.args;
      expect(options.withRelated).to.equal(['region']);
    });
  });

  experiment('.update', () => {
    beforeEach(async () => {
      await billingBatches.update('00000000-0000-0000-0000-000000000000', { foo: 'bar' });
    });

    test('forges a model with the expected id', async () => {
      const [forgeArg] = BillingBatch.forge.lastCall.args;
      expect(forgeArg).to.equal({
        billingBatchId: '00000000-0000-0000-0000-000000000000'
      });
    });

    test('passes through the expected changes', async () => {
      const [changes] = stub.save.lastCall.args;
      expect(changes).to.equal({ foo: 'bar' });
    });
  });

  experiment('.delete', () => {
    beforeEach(async () => {
      await billingBatches.delete('00000000-0000-0000-0000-000000000000');
    });

    test('forges a model with the expected id', async () => {
      const [forgeArg] = BillingBatch.forge.lastCall.args;
      expect(forgeArg).to.equal({
        billingBatchId: '00000000-0000-0000-0000-000000000000'
      });
    });

    test('call destroy to remove the entity', async () => {
      expect(stub.destroy.called).to.be.true();
    });
  });
});
