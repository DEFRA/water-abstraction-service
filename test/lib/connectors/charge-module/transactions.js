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

const request = require('../../../../src/lib/connectors/charge-module/request');
const transactionsApiConnector = require('../../../../src/lib/connectors/charge-module/transactions');

experiment('lib/connectors/charge-module/transactions', () => {
  beforeEach(async () => {
    sandbox.stub(request, 'get').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.get', () => {
    beforeEach(async () => {
      await transactionsApiConnector.get('test-transaction-id');
    });

    test('the method is GET', async () => {
      expect(request.get.called).to.be.true();
    });

    test('the correct endpoint is called', async () => {
      const [path] = request.get.lastCall.args;
      expect(path).to.equal('v1/wrls/transactions/test-transaction-id');
    });
  });
});
