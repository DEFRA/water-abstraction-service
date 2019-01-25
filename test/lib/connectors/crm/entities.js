
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const serviceRequest = require('../../../../src/lib/connectors/service-request');
const entitiesConnector = require('../../../../src/lib/connectors/crm/entities');

experiment('getEntityCompanies', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await entitiesConnector.getEntityCompanies('test-id');
    const expectedUrl = `${process.env.CRM_URI}/entity/test-id/companies`;
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
    const expectedUrl = `${process.env.CRM_URI}/entity/test-id/verifications`;
    const arg = serviceRequest.get.args[0][0];
    expect(arg).to.equal(expectedUrl);
  });
});
