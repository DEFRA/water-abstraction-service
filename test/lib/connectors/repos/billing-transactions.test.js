const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const billingTransactions = require('../../../../src/lib/connectors/repos/billing-transactions');
const { BillingTransaction, bookshelf } = require('../../../../src/lib/connectors/bookshelf');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-transactions');

experiment('lib/connectors/repos/billing-transactions', () => {
  let model, stub, knexStub;

  beforeEach(async () => {
    knexStub = {
      where: sandbox.stub().returnsThis(),
      whereIn: sandbox.stub().returnsThis(),
      delete: sandbox.stub()
    };

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
      orderBy: sandbox.stub().returnsThis(),
      fetchPage: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis(),
      save: sandbox.stub().resolves(model)
    };
    sandbox.stub(BillingTransaction, 'forge').returns(stub);
    sandbox.stub(BillingTransaction, 'collection').returns(stub);
    sandbox.stub(BillingTransaction, 'where').returns(stub);

    sandbox.stub(raw, 'multiRow');
    sandbox.stub(raw, 'singleRow');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    let result;

    beforeEach(async () => {
      result = await billingTransactions.findOne('test-id');
    });

    test('calls model.forge with correct id', async () => {
      const [params] = BillingTransaction.forge.lastCall.args;
      expect(params).to.equal({ billingTransactionId: 'test-id' });
    });

    test('calls fetch() with related models', async () => {
      const [params] = stub.fetch.lastCall.args;
      expect(params.withRelated).to.equal([
        'chargeElement',
        'chargeElement.chargeCategory',
        'chargeElement.chargePurposes',
        'billingInvoiceLicence',
        'billingInvoiceLicence.licence',
        'billingInvoiceLicence.licence.region',
        'billingInvoiceLicence.billingInvoice',
        'billingInvoiceLicence.billingInvoice.billingBatch'
      ]);
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.find', () => {
    let result;

    beforeEach(async () => {
      result = await billingTransactions.find(['test-id-1', 'test-id-2']);
    });

    test('calls model.collection', async () => {
      expect(BillingTransaction.collection.callCount).to.equal(1);
    });

    test('queries for matching ID(s)', async () => {
      const [field, operator, values] = stub.where.lastCall.args;
      expect(field).to.equal('billing_transaction_id');
      expect(operator).to.equal('in');
      expect(values).to.equal(['test-id-1', 'test-id-2']);
    });

    test('calls fetch() with related models', async () => {
      const [params] = stub.fetch.lastCall.args;
      expect(params.withRelated).to.equal([
        'chargeElement',
        'chargeElement.chargeCategory',
        'chargeElement.chargePurposes',
        'billingInvoiceLicence',
        'billingInvoiceLicence.licence',
        'billingInvoiceLicence.licence.region',
        'billingInvoiceLicence.billingInvoice',
        'billingInvoiceLicence.billingInvoice.billingBatch'
      ]);
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.findByBatchId', () => {
    beforeEach(async () => {
      await billingTransactions.findByBatchId('batch-id');
    });

    test('performs multi-row query with correct params', async () => {
      expect(raw.multiRow.calledWith(
        queries.findByBatchId, { batchId: 'batch-id' }
      )).to.be.true();
    });
  });

  experiment('.findHistoryByBatchId', () => {
    beforeEach(async () => {
      await billingTransactions.findHistoryByBatchId('batch-id');
    });

    test('performs multi-row query with correct params', async () => {
      expect(raw.multiRow.calledWith(
        queries.findHistoryByBatchId, { batchId: 'batch-id' }
      )).to.be.true();
    });
  });

  experiment('.deleteRecords', () => {
    beforeEach(async () => {
      sandbox.stub(bookshelf, 'knex').returns(knexStub);
      await billingTransactions.delete('transaction-id');
    });

    test('intialises knex() with the correct table', async () => {
      expect(
        bookshelf.knex.calledWith('water.billing_transactions')
      ).to.be.true();
    });

    test('calles .whereIn() on query builder with supplied IDs in an array', async () => {
      expect(
        knexStub.whereIn.calledWith('billing_transaction_id', ['transaction-id'])
      ).to.be.true();
    });

    test('calls .delete() on query builder', async () => {
      expect(knexStub.delete.called).to.be.true();
    });
  });

  experiment('.create', () => {
    let result;

    const data = {
      billingInvoiceLicenceId: '82edd393-c53b-4ea9-bd51-f56cc065777e',
      chargeElementId: 'd40278b2-3cdd-4dd0-8546-d5e0baf070cb'
    };

    beforeEach(async () => {
      result = await billingTransactions.create(data);
    });

    test('calls model.forge with correct data', async () => {
      const [params] = BillingTransaction.forge.lastCall.args;
      expect(params).to.equal(data);
    });

    test('.save() on the model', async () => {
      expect(stub.save.called).to.be.true();
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.findStatusCountsByBatchId', () => {
    beforeEach(async () => {
      await billingTransactions.findStatusCountsByBatchId('batch-id');
    });

    test('performs multi-row query with correct params', async () => {
      expect(raw.multiRow.calledWith(
        queries.findStatusCountsByBatchId, { batchId: 'batch-id' }
      )).to.be.true();
    });
  });

  experiment('.update', () => {
    experiment('for a scalar ID', () => {
      const transactionId = 'test-transaction-id';
      const changes = {
        status: 'error'
      };

      beforeEach(async () => {
        await billingTransactions.update(transactionId, changes);
      });

      test('calls model.where with correct data', async () => {
        const [field, operator, value] = BillingTransaction.where.lastCall.args;
        expect(field).to.equal('billing_transaction_id');
        expect(operator).to.equal('in');
        expect(value).to.equal([transactionId]);
      });

      test('calls .save() on the model using patch mode', async () => {
        expect(stub.save.calledWith(changes, { patch: true, require: true })).to.be.true();
      });
    });

    experiment('when a third boolean argument is supplied for isUpdateRequired', () => {
      const transactionId = 'test-transaction-id';
      const changes = {
        status: 'error'
      };

      beforeEach(async () => {
        await billingTransactions.update(transactionId, changes, false);
      });

      test('passes the argument through to the require bookshelf option', async () => {
        expect(stub.save.calledWith(changes, { patch: true, require: false })).to.be.true();
      });
    });

    experiment('for an array of IDs', () => {
      const transactionId1 = 'test-transaction-id-1';
      const transactionId2 = 'test-transaction-id-1';

      const changes = {
        status: 'error'
      };

      beforeEach(async () => {
        await billingTransactions.update([transactionId1, transactionId2], changes);
      });

      test('calls model.where with correct data', async () => {
        const [field, operator, value] = BillingTransaction.where.lastCall.args;
        expect(field).to.equal('billing_transaction_id');
        expect(operator).to.equal('in');
        expect(value).to.equal([transactionId1, transactionId2]);
      });

      test('calls .save() on the model using patch mode', async () => {
        expect(stub.save.calledWith(changes, { patch: true, require: true })).to.be.true();
      });
    });
  });

  experiment('.deleteByInvoiceLicenceId', () => {
    beforeEach(async () => {
      sandbox.stub(bookshelf, 'knex').returns(knexStub);
      await billingTransactions.deleteByInvoiceLicenceId('test-invoice-licence-id');
    });

    test('intialises knex() with the correct table', async () => {
      expect(
        bookshelf.knex.calledWith('water.billing_transactions')
      ).to.be.true();
    });

    test('calles .where() on query builder with supplied ID', async () => {
      expect(
        knexStub.where.calledWith('billing_invoice_licence_id', 'test-invoice-licence-id')
      ).to.be.true();
    });

    test('calls .delete() on query builder', async () => {
      expect(knexStub.delete.called).to.be.true();
    });
  });

  experiment('.deleteByBatchId', () => {
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      sandbox.stub(bookshelf.knex, 'raw');
      await billingTransactions.deleteByBatchId(batchId);
    });

    test('calls knex.raw() with correct argumements', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteByBatchId);
      expect(params).to.equal({ batchId });
    });
  });

  experiment('.deleteByInvoiceId', () => {
    beforeEach(async () => {
      sandbox.stub(bookshelf.knex, 'raw');
      await billingTransactions.deleteByInvoiceId('test-invoice-id');
    });

    test('calls knex.raw with the correct query and params', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteByInvoiceId);
      expect(params).to.equal({
        billingInvoiceId: 'test-invoice-id'
      });
    });
  });

  experiment('.countByBatchId', () => {
    let result;

    beforeEach(async () => {
      raw.singleRow.resolves({ count: '5' });
      result = await billingTransactions.countByBatchId('test-batch-id');
    });

    test('calls raw.singleRow with the correct query and params', async () => {
      const [query, params] = raw.singleRow.lastCall.args;
      expect(query).to.equal(queries.countByBatchId);
      expect(params).to.equal({
        billingBatchId: 'test-batch-id'
      });
    });

    test('resolves with the count converted to an integer', async () => {
      expect(result).to.equal(5);
    });
  });
});
