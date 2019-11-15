const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const serviceVersionConnector = require('../../../../src/lib/connectors/crm/service-version');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('connectors/crm/service-version', () => {
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
      await serviceVersionConnector.getServiceVersion();
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.endWith('/status');
    });
  });
});
