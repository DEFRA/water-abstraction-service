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

const crmConnector = require('../../../../src/lib/connectors/crm/kpi-reporting');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

experiment('./lib/connectors/crm/kpi-reporting', () => {
  experiment('.getKPIAccessRequests', () => {
    beforeEach(async () => {
      sandbox.stub(serviceRequest, 'get').resolves();
      sandbox.stub(config.services, 'crm').value('http://test.defra/crm/1.0');
      await crmConnector.getKPIAccessRequests();
    });

    afterEach(async => { sandbox.restore(); });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/crm/1.0/kpi/access-requests');
    });
  });
});
