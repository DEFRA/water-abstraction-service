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
const billRunsApiConnectorWithRetry = require('../../../../src/lib/connectors/charge-module/bill-runs-with-retry');

experiment('lib/connectors/charge-module/bill-runs-with-retry', () => {
  let result;

  beforeEach(async () => {
    sandbox.stub(billRunsApiConnectorWithRetry.options, 'minTimeout').value(100);
    sandbox.stub(request, 'get').resolves({
      billRun: {
        status: 'generating_summary'
      }
    });
    request.get.onCall(1).resolves({
      billRun: {
        status: 'initialised',
        summary: {}
      }
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.get', () => {
    beforeEach(async () => {
      result = await billRunsApiConnectorWithRetry.get('test-id');
    });

    test('the method is GET', async () => {
      expect(request.get.called).to.be.true();
    });

    test('the correct endpoint is called', async () => {
      const [path] = request.get.lastCall.args;
      expect(request.get.callCount).to.equal(2);
      expect(path).to.equal('v1/wrls/billruns/test-id');
    });

    test('resolves with data only when the status has changed from "generating_summary"', async () => {
      expect(result.billRun.summary).to.be.an.object();
    });
  });

  experiment('.getCustomer', () => {
    beforeEach(async () => {
      result = await billRunsApiConnectorWithRetry.getCustomer('test-id', 'customer-id');
    });

    test('the method is GET', async () => {
      expect(request.get.called).to.be.true();
    });

    test('the correct endpoint is called', async () => {
      const [path] = request.get.lastCall.args;
      expect(request.get.callCount).to.equal(2);
      expect(path).to.equal('v1/wrls/billruns/test-id');
    });

    test('the correct customer is specified', async () => {
      const [, query] = request.get.lastCall.args;
      expect(query).to.equal({
        customerReference: 'customer-id'
      });
    });

    test('resolves with data only when the status has changed from "generating_summary"', async () => {
      expect(result.billRun.summary).to.be.an.object();
    });
  });
});
