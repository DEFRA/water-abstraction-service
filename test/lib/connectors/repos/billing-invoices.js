const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { bookshelf } = require('../../../../src/lib/connectors/bookshelf');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-invoices');

const billingInvoices = require('../../../../src/lib/connectors/repos/billing-invoices');

const result = {
  rows: [{
    billing_invoice_id: 'test-invoice-id'
  }]
};

experiment('lib/connectors/repos/billing-invoices', () => {
  beforeEach(async () => {
    sandbox.stub(bookshelf.knex, 'raw').resolves(result);
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
});
