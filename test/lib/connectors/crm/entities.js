const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const entitiesConnector = require('../../../../src/lib/connectors/crm/entities');
const config = require('../../../../config');
const helpers = require('@envage/water-abstraction-helpers');

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

experiment('updateEntityEmail', () => {
  beforeEach(async () => {
    sandbox.stub(helpers.serviceRequest, 'patch').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await entitiesConnector.updateEntityEmail('test-entity-id', 'test-email@domain.com');
    const expectedUrl = `${process.env.CRM_URI}/entity/test-entity-id/entity`;
    const arg = helpers.serviceRequest.patch.args[0][0];
    expect(arg).to.equal(expectedUrl);
  });
});
