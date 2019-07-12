const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test } = exports.lab = require('lab').script();

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const importConnector = require('../../../src/lib/connectors/import');

experiment('connectors/import', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({
      version: '0.0.1'
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getServiceVersion', () => {
    test('calls the expected URL', async () => {
      await importConnector.getServiceVersion();
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.endWith('/status');
    });
  });
});
