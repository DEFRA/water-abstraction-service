const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const BillingTransactionRepository = require('../../../../src/lib/connectors/repository/BillingTransactionRepository');

experiment('lib/connectors/repository/BillingTransactionRepository', () => {
  beforeEach(async () => {
    sandbox.stub(BillingTransactionRepository.prototype, 'dbQuery').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.deleteByInvoiceAccount', () => {
    beforeEach(async () => {
      const repo = new BillingTransactionRepository();
      await repo.deleteByInvoiceAccount('test-batch-id', 'test-invoice-account-id');
    });

    test('passes the expected parameters to the query', async () => {
      const [, params] = BillingTransactionRepository.prototype.dbQuery.lastCall.args;
      expect(params[0]).to.equal('test-batch-id');
      expect(params[1]).to.equal('test-invoice-account-id');
    });
  });
});
