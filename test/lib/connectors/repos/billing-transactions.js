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
const { BillingTransaction } = require('../../../../src/lib/connectors/bookshelf');

experiment('lib/connectors/repos/billing-transactions', () => {
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
      orderBy: sandbox.stub().returnsThis(),
      fetchPage: sandbox.stub().resolves(model)
    };
    sandbox.stub(BillingTransaction, 'forge').returns(stub);
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
      expect(params).to.equal({ billing_transaction_id: 'test-id' });
    });

    test('calls fetch() with related models', async () => {
      const [params] = stub.fetch.lastCall.args;
      expect(params.withRelated).to.equal([
        'chargeElement',
        'billingInvoiceLicence',
        'billingInvoiceLicence.licence',
        'billingInvoiceLicence.licence.region',
        'billingInvoiceLicence.billingInvoice',
        'billingInvoiceLicence.billingInvoice.billingBatch',
        'billingInvoiceLicence.billingInvoice.billingBatch.region'
      ]);
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });
});
