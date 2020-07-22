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

const idmConnector = require('../../../../src/lib/connectors/idm/kpi-reporting');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

experiment('lib/connectors/idm/kpi-reporting', () => {
  experiment('.getKPIRegistrations', () => {
    beforeEach(async () => {
      sandbox.stub(serviceRequest, 'get').resolves();
      sandbox.stub(config.services, 'idm').value('http://test.defra/idm/1.0');
      await idmConnector.getKPIRegistrations();
    });

    afterEach(async => { sandbox.restore(); });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/idm/1.0/kpi/registrations');
    });
  });
});
