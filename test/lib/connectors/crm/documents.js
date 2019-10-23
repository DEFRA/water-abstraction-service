const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const documentsConnector = require('../../../../src/lib/connectors/crm/documents');

const config = require('../../../../config');

experiment('lib/connectors/crm/documents', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
    sandbox.stub(serviceRequest, 'patch').resolves({});
    sandbox.stub(serviceRequest, 'delete').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getDocumentUsers', () => {
    test('passes the expected URL to the request', async () => {
      await documentsConnector.getDocumentUsers('test-id');
      const expectedUrl = `${config.services.crm}/documents/test-id/users`;
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });
  });

  experiment('.getDocument', () => {
    test('passes the expected default URL to the request', async () => {
      await documentsConnector.getDocument('test-id');
      const expectedUrl = `${config.services.crm}/documentHeader/test-id`;
      const [url, options] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
      expect(JSON.parse(options.qs.filter).includeExpired).to.be.false();
    });

    test('expired licences can be requested', async () => {
      await documentsConnector.getDocument('test-id', true);
      const expectedUrl = `${config.services.crm}/documentHeader/test-id`;
      const [url, options] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
      expect(JSON.parse(options.qs.filter).includeExpired).to.be.true();
    });
  });

  experiment('.deleteAcceptanceTestData', () => {
    test('makes a delete request to the expected url', async () => {
      await documentsConnector.deleteAcceptanceTestData();

      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal(`${config.services.crm}/acceptance-tests/documents`);
    });
  });
});
