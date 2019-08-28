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

  experiment('.unlinkLicence', () => {
    test('passes the expected URL to the request', async () => {
      await documentsConnector.unlinkLicence('doc-id');
      const expectedUrl = `${config.services.crm}/documentHeader/doc-id`;
      const expectedBody = { body: { company_entity_id: null, verification_id: null, document_name: null } };
      const [url, body] = serviceRequest.patch.lastCall.args;
      expect(url).to.equal(expectedUrl);
      expect(body).to.equal(expectedBody);
    });
  });
});
