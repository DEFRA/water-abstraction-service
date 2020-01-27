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

const transactionsConnector = require('../../../../src/lib/connectors/charge-module/transactions');
const request = require('../../../../src/lib/connectors/charge-module/request');

experiment('lib/connectors/charge-module/transactions', () => {
  beforeEach(async () => {
    sandbox.stub(request, 'get').resolves();
    sandbox.stub(request, 'post').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getTransactionQueue', () => {
    experiment('for a request with a batchId only', () => {
      let path;
      let query;

      beforeEach(async () => {
        await transactionsConnector.getTransactionQueue('test-batch-id');
        ([path, query] = request.get.lastCall.args);
      });

      test('the expected URL path is used', async () => {
        expect(path).to.equal('v1/wrls/transaction_queue');
      });

      test('the query params are configured to avoid pagination', async () => {
        expect(query.perPage).to.equal(1000000);
        expect(query.page).to.equal(1);
      });

      test('the query params include the batch id', async () => {
        expect(query.batchNumber).to.equal('test-batch-id');
      });

      test('the query params do not include the customer reference', async () => {
        expect(query).not.to.include('customerReference');
      });
    });

    experiment('for a request with a batchId and invoice account id', () => {
      let path;
      let query;

      beforeEach(async () => {
        await transactionsConnector.getTransactionQueue('test-batch-id', 'test-customer');
        ([path, query] = request.get.lastCall.args);
      });

      test('the expected URL path is used', async () => {
        expect(path).to.equal('v1/wrls/transaction_queue');
      });

      test('the query params are configured to avoid pagination', async () => {
        expect(query.perPage).to.equal(1000000);
        expect(query.page).to.equal(1);
      });

      test('the query params include the batch id', async () => {
        expect(query.batchNumber).to.equal('test-batch-id');
      });

      test('the query params include the customer reference', async () => {
        expect(query.customerReference).to.equal('test-customer');
      });
    });
  });

  experiment('.createTransaction', () => {
    let path, payload;
    const transaction = {
      foo: 'bar'
    };

    beforeEach(async () => {
      await transactionsConnector.createTransaction(transaction);
      ([path, payload] = request.post.lastCall.args);
    });

    test('the expected URL path is used', async () => {
      expect(path).to.equal('v1/wrls/transaction_queue');
    });

    test('the expected payload is used', async () => {
      expect(payload).to.equal(transaction);
    });
  });
});
