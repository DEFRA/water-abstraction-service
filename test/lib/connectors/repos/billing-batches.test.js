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
const { BillingBatch, bookshelf } = require('../../../../src/lib/connectors/bookshelf/');
const { BATCH_STATUS, BATCH_TYPE } = require('../../../../src/lib/models/batch');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-batches');

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
      query: sandbox.stub().returnsThis(),
      save: sandbox.stub().resolves(model),
      destroy: sandbox.spy()
    };
    sandbox.stub(BillingBatch, 'forge').returns(stub);
    sandbox.stub(helpers, 'findMany').resolves({ foo: 'bar' });
    sandbox.stub(bookshelf.knex, 'raw');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    let result;

    experiment('when a record is found', () => {
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

    experiment('when a record is not found', () => {
      beforeEach(async () => {
        stub.fetch.resolves(null);
        result = await billingBatches.findOne('test-id');
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
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

  experiment('.findByStatuses', () => {
    beforeEach(async () => {
      await billingBatches.findByStatuses(['review', 'processing']);
    });

    test('calls model.forge with no arguments', async () => {
      const { args } = BillingBatch.forge.lastCall;
      expect(args).to.equal([]);
    });

    test('calls query() to filter by status', async () => {
      const params = stub.query.lastCall.args;
      expect(params[0]).to.equal('whereIn');
      expect(params[1]).to.equal('status');
      expect(params[2]).to.equal(['review', 'processing']);
    });

    test('orders by date_created desc', async () => {
      const params = stub.orderBy.lastCall.args;

      expect(params[0]).to.equal('date_created');
      expect(params[1]).to.equal('desc');
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

    test('calls destroy() to delete found records', async () => {
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: true });
    });

    test('when deletion is not required, calls destroy() with the correct params', async () => {
      await billingBatches.delete('00000000-0000-0000-0000-000000000000', false);
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: false });
    });
  });

  experiment('.findOneWithInvoicesWithTransactions', () => {
    let result;
    experiment('when a record is found', () => {
      beforeEach(async () => {
        model.toJSON.returns({ foo: 'bar' });
        result = await billingBatches.findOneWithInvoicesWithTransactions('00000000-0000-0000-0000-000000000000');
      });

      test('forges a model with the expected id', async () => {
        const [forgeArg] = BillingBatch.forge.lastCall.args;
        expect(forgeArg).to.equal({
          billingBatchId: '00000000-0000-0000-0000-000000000000'
        });
      });

      test('call fetch with correct parameters', async () => {
        expect(stub.fetch.lastCall.args[0].withRelated[0]).to.equal('region');
        expect(stub.fetch.lastCall.args[0].withRelated[1]).to.equal('billingInvoices');
        expect(stub.fetch.lastCall.args[0].withRelated[2]).to.equal('billingInvoices.billingInvoiceLicences');
        expect(stub.fetch.lastCall.args[0].withRelated[3]).to.equal('billingInvoices.billingInvoiceLicences.licence');
        expect(stub.fetch.lastCall.args[0].withRelated[4]).to.equal('billingInvoices.billingInvoiceLicences.licence.region');
        expect(stub.fetch.lastCall.args[0].withRelated[5]).to.equal('billingInvoices.billingInvoiceLicences.billingTransactions');
        expect(stub.fetch.lastCall.args[0].withRelated[6]).to.equal('billingInvoices.billingInvoiceLicences.billingTransactions.billingVolume');
        expect(stub.fetch.lastCall.args[0].withRelated[7]).to.equal('billingInvoices.billingInvoiceLicences.billingTransactions.chargeElement');
        expect(stub.fetch.lastCall.args[0].withRelated[8]).to.equal('billingInvoices.billingInvoiceLicences.billingTransactions.chargeElement.purposeUse');
      });

      test('returns the result of the toJSON() call', async () => {
        expect(result).to.equal({ foo: 'bar' });
      });
    });

    experiment('when a record is not found', () => {
      beforeEach(async () => {
        stub.fetch.resolves(null);
        result = await billingBatches.findOneWithInvoicesWithTransactions('00000000-0000-0000-0000-000000000000');
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });
  experiment('.findOneWithInvoices', () => {
    let result;

    experiment('when a record is found', () => {
      beforeEach(async () => {
        await billingBatches.findOneWithInvoices('00000000-0000-0000-0000-000000000000');
      });

      test('forges a model with the expected id', async () => {
        const [forgeArg] = BillingBatch.forge.lastCall.args;
        expect(forgeArg).to.equal({
          billingBatchId: '00000000-0000-0000-0000-000000000000'
        });
      });

      test('call fetch with correct parameters', async () => {
        expect(stub.fetch.lastCall.args[0].withRelated[0]).to.equal('region');
        expect(stub.fetch.lastCall.args[0].withRelated[1]).to.equal('billingInvoices');
        expect(stub.fetch.lastCall.args[0].withRelated[2]).to.equal('billingInvoices.billingInvoiceLicences');
        expect(stub.fetch.lastCall.args[0].withRelated[3]).to.equal('billingInvoices.billingInvoiceLicences.licence');
        expect(stub.fetch.lastCall.args[0].withRelated[4]).to.equal('billingInvoices.billingInvoiceLicences.licence.region');
      });
    });

    experiment('when a record is not found', () => {
      beforeEach(async () => {
        stub.fetch.resolves(null);
        result = await billingBatches.findOneWithInvoices('00000000-0000-0000-0000-000000000000');
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });

  experiment('.findSentTptBatchesForFinancialYearAndRegion', () => {
    beforeEach(async () => {
      await billingBatches.findSentTptBatchesForFinancialYearAndRegion(2020, '00000000-0000-0000-0000-000000000000', BATCH_TYPE.twoPartTariff);
    });

    test('calls helpers .findMany() with the correct params', async () => {
      const [model, conditions, withRelated] = helpers.findMany.lastCall.args;
      expect(model).to.equal(BillingBatch);
      expect(conditions.batch_type).to.equal(BATCH_TYPE.twoPartTariff);
      expect(conditions.to_financial_year_ending).to.equal(2020);
      expect(conditions.status).to.equal(BATCH_STATUS.sent);
      expect(conditions.region_id).to.equal('00000000-0000-0000-0000-000000000000');
      expect(withRelated).to.equal([
        'billingInvoices',
        'billingInvoices.billingInvoiceLicences',
        'billingInvoices.billingInvoiceLicences.licence'
      ]);
    });
  });

  experiment('.findByRegionId', () => {
    beforeEach(async () => {
      await billingBatches.findByRegionId('region-id');
    });

    test('calls helpers .findMany() with the correct params', async () => {
      const [model, conditions, withRelated] = helpers.findMany.lastCall.args;
      expect(model).to.equal(BillingBatch);
      expect(conditions).to.equal({ region_id: 'region-id' });
      expect(withRelated).to.equal(['region']);
    });
  });

  experiment('.find', () => {
    beforeEach(async () => {
      await billingBatches.find();
    });

    test('delegates to helpers.findMany', async () => {
      expect(helpers.findMany.calledWith(BillingBatch)).to.be.true();
    });
  });

  experiment('.deleteAllBillingData', () => {
    beforeEach(async () => {
      await billingBatches.deleteAllBillingData();
    });

    test('calls knex.raw() with the correct query', async () => {
      expect(
        bookshelf.knex.raw.calledWith(queries.deleteAllBillingData)
      ).to.be.true();
    });
  });
});
