const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const { bookshelf, BillingInvoice } = require('../../../../src/lib/connectors/bookshelf');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-invoices');

const billingInvoices = require('../../../../src/lib/connectors/repos/billing-invoices');
const paginationHelper = require('../../../../src/lib/connectors/repos/lib/envelope');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');

const result = {
  rows: [{
    billing_invoice_id: 'test-invoice-id'
  }]
};

experiment('lib/connectors/repos/billing-invoices', () => {
  let model, stub;

  beforeEach(async () => {
    sandbox.stub(bookshelf.knex, 'raw').resolves(result);
    sandbox.stub(paginationHelper, 'paginatedEnvelope').returns({ data: [{ foo: 'bar' }], pagination: { page: 1, perPage: 10 } });

    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };

    stub = {
      fetch: sandbox.stub().resolves(model),
      orderBy: sandbox.stub().returnsThis(),
      fetchPage: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis(),
      query: sandbox.stub().returnsThis(),
      save: sandbox.stub().resolves(model),
      destroy: sandbox.stub().resolves(model)
    };

    sandbox.stub(BillingInvoice, 'forge').returns(stub);

    sandbox.stub(raw, 'multiRow');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.upsert', () => {
    let result;

    beforeEach(async () => {
      result = await billingInvoices.upsert({
        invoiceAccountId: 'test-invoice-account-id'
      });
    });

    test('calls knex.raw with the correct arguments', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.upsert);
      expect(params).to.equal({
        invoiceAccountId: 'test-invoice-account-id'
      });
    });

    test('returns the first found row with camelCased keys', async () => {
      expect(result).to.equal({
        billingInvoiceId: 'test-invoice-id'
      });
    });
  });

  experiment('.deleteEmptyBatchById', () => {
    beforeEach(async () => {
      await billingInvoices.deleteEmptyByBatchId('test-batch-id');
    });

    test('calls knex.raw with the correct arguments', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteEmptyByBatchId);
      expect(params).to.equal({
        batchId: 'test-batch-id'
      });
    });
  });

  experiment('.findOne', () => {
    let result;

    beforeEach(async () => {
      model.toJSON.returns({ foo: 'bar' });
      result = await billingInvoices.findOne('test-id');
    });

    test('calls model.forge with correct id', async () => {
      const [params] = BillingInvoice.forge.lastCall.args;
      expect(params).to.equal({ billingInvoiceId: 'test-id' });
    });

    test('calls fetch() with expected options', async () => {
      const [params] = stub.fetch.lastCall.args;
      expect(params.require).to.be.false();
      expect(params.withRelated).to.equal([
        'billingBatch',
        'billingBatch.region',
        'billingInvoiceLicences',
        'billingInvoiceLicences.licence',
        'billingInvoiceLicences.licence.region',
        'billingInvoiceLicences.billingTransactions',
        'billingInvoiceLicences.billingTransactions.billingVolume',
        'billingInvoiceLicences.billingTransactions.chargeElement',
        'billingInvoiceLicences.billingTransactions.chargeElement.purposeUse',
        'linkedBillingInvoices',
        'originalBillingInvoice'
      ]);
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });

    experiment('when no matching invoice is found', () => {
      beforeEach(async () => {
        stub.fetch.returns();
        result = await billingInvoices.findOne('test-id');
      });

      test('returns null', () => {
        expect(result).to.be.null();
      });
    });
  });

  experiment('.deleteByBatchId', () => {
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      await billingInvoices.deleteByBatchId(batchId);
    });

    test('calls forge() on the model', async () => {
      expect(BillingInvoice.forge.called).to.be.true();
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
      await billingInvoices.deleteByBatchId(batchId, false);
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: false });
    });
  });

  experiment('.delete', () => {
    const billingInvoiceId = uuid();

    beforeEach(async () => {
      await billingInvoices.delete(billingInvoiceId);
    });

    test('the model is forged with correct params', async () => {
      expect(BillingInvoice.forge.calledWith({
        billingInvoiceId
      })).to.be.true();
    });

    test('the model is destroyed', async () => {
      expect(stub.destroy.called).to.be.true();
    });
  });

  experiment('.update', () => {
    const billingInvoiceId = uuid();
    const changes = { foo: 'bar' };

    beforeEach(async () => {
      await billingInvoices.update(billingInvoiceId, changes);
    });

    test('the model is forged with correct params', async () => {
      expect(BillingInvoice.forge.calledWith({
        billingInvoiceId
      })).to.be.true();
    });

    test('the model is destroyed', async () => {
      expect(stub.save.calledWith(changes)).to.be.true();
    });
  });

  experiment('.findAllForInvoiceAccount', () => {
    let result;
    const invoiceAccountId = uuid();

    beforeEach(async () => {
      result = await billingInvoices.findAllForInvoiceAccount(invoiceAccountId, 1, 10);
    });

    test('the model is forged', async () => {
      expect(BillingInvoice.forge.called).to.be.true();
    });

    test('calls query() with a function', async () => {
      const [func] = stub.query.lastCall.args;
      expect(func).to.be.a.function();
    });

    test('calls fetchPage() with the correct params', async () => {
      const [params] = stub.fetchPage.lastCall.args;
      expect(params.pageSize).to.equal(10);
      expect(params.page).to.equal(1);
      expect(params.withRelated).to.equal([
        'billingInvoiceLicences',
        'billingBatch',
        'billingBatch.region'
      ]);
    });

    test('returns the result of the paginationHelper.paginatedEnvelope call', async () => {
      expect(result).to.equal({ data: [{ foo: 'bar' }], pagination: { page: 1, perPage: 10 } });
    });
  });

  experiment('.findByIsFlaggedForRebillingAndRegion', () => {
    const regionId = uuid();

    beforeEach(async () => {
      await billingInvoices.findByIsFlaggedForRebillingAndRegion(regionId);
    });

    test('calls raw.multiRow with the correct query', async () => {
      expect(raw.multiRow.calledWith(
        queries.findByIsFlaggedForRebillingAndRegion, { regionId }
      ));
    });
  });

  experiment('.resetIsFlaggedForRebilling', () => {
    const batchId = uuid();

    beforeEach(async () => {
      await billingInvoices.resetIsFlaggedForRebilling(batchId);
    });

    test('calls raw.multiRow with the correct query', async () => {
      expect(raw.multiRow.calledWith(
        queries.resetIsFlaggedForRebilling, { batchId }
      ));
    });
  });

  experiment('.resetIsFlaggedForRebillingByInvoiceId', () => {
    const originalInvoiceId = uuid();
    const invoiceId = originalInvoiceId;

    beforeEach(async () => {
      await billingInvoices.resetIsFlaggedForRebillingByInvoiceId(originalInvoiceId);
    });

    test('calls raw.multiRow with the correct query', async () => {
      expect(raw.multiRow.calledWith(
        queries.resetIsFlaggedForRebillingByInvoiceId, { invoiceId }
      ));
    });
  });

  experiment('.deleteInvoicesByOriginalInvoiceId', () => {
    const originalInvoiceId = uuid();

    beforeEach(async () => {
      await billingInvoices.deleteInvoicesByOriginalInvoiceId(originalInvoiceId);
    });

    test('calls raw.multiRow with the correct query', async () => {
      expect(raw.multiRow.calledWith(
        queries.deleteByOriginalInvoiceId, { originalInvoiceId }
      ));
    });
  });
});
