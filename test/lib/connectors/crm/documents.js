const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const documentsConnector = require('../../../../src/lib/connectors/crm/documents');

const config = require('../../../../config');

experiment('getDocumentUsers', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await documentsConnector.getDocumentUsers('test-id');
    const expectedUrl = `${config.services.crm}/documents/test-id/users`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });
});
