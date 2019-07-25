const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const entitiesConnector = require('../../../../src/lib/connectors/crm/entities');
const config = require('../../../../config');

experiment('getEntityCompanies', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await entitiesConnector.getEntityCompanies('test-id');
    const expectedUrl = `${config.services.crm}/entity/test-id/companies`;
    const arg = serviceRequest.get.args[0][0];
    expect(arg).to.equal(expectedUrl);
  });
});

experiment('getEntityVerifications', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await entitiesConnector.getEntityVerifications('test-id');
    const expectedUrl = `${config.services.crm}/entity/test-id/verifications`;
    const arg = serviceRequest.get.args[0][0];
    expect(arg).to.equal(expectedUrl);
  });
});
