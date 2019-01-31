const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const serviceRequest = require('../../../../src/lib/connectors/service-request');
const documentsConnector = require('../../../../src/lib/connectors/crm/documents');

experiment('getDocumentUsers', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await documentsConnector.getDocumentUsers('test-id');
    const expectedUrl = `${process.env.CRM_URI}/documents/test-id/users`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });
});
