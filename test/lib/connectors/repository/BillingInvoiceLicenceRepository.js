const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const BillingInvoiceLicenceRepository = require('../../../../src/lib/connectors/repository/BillingInvoiceLicenceRepository.js');

const transactionId = 'd5fbbfb3-c169-496c-8fe6-619a1b1794b5';

experiment('lib/connectors/repository/BillingInvoiceLicenceRepository', () => {
  beforeEach(async () => {
    sandbox.stub(BillingInvoiceLicenceRepository.prototype, 'dbQuery');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOneByTransactionId', () => {
    let result;

    experiment('when a row is found', () => {
      beforeEach(async () => {
        BillingInvoiceLicenceRepository.prototype.dbQuery.resolves({
          rows: [{
            foo: 'bar'
          }]
        });

        const repo = new BillingInvoiceLicenceRepository();
        result = await repo.findOneByTransactionId(transactionId);
      });

      test('calls .dbQuery with correct params', async () => {
        expect(BillingInvoiceLicenceRepository.prototype.dbQuery.calledWith(
          BillingInvoiceLicenceRepository._findOneByTransactionIdQuery, [transactionId]
        )).to.be.true();
      });

      test('resolves with the first row', async () => {
        expect(result).to.equal({ foo: 'bar' });
      });
    });

    experiment('when no rows are found', () => {
      beforeEach(async () => {
        BillingInvoiceLicenceRepository.prototype.dbQuery.resolves({
          rows: []
        });

        const repo = new BillingInvoiceLicenceRepository();
        result = await repo.findOneByTransactionId(transactionId);
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });
});
