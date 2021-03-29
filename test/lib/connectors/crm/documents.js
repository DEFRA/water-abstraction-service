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
    sandbox.stub(documentsConnector, 'updateOne').resolves({});
    sandbox.stub(documentsConnector, 'findAll').resolves();
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

  experiment('.setLicenceName', () => {
    test('makes a update request to the expected url', async () => {
      await documentsConnector.setLicenceName('doc-id', 'name');
      const args = documentsConnector.updateOne.lastCall.args;
      expect(args[0]).to.equal('doc-id');
      expect(args[1].document_name).to.equal('name');
    });
  });

  experiment('.getDocumentsByLicenceNumbers', () => {
    experiment('for a single licence number', () => {
      let result;

      beforeEach(async () => {
        documentsConnector.findAll.resolves([{
          document_id: 'test-document-id',
          system_external_id: 'test-licence-number'
        }]);

        result = await documentsConnector.getDocumentsByLicenceNumbers(['test-licence-number']);
      });

      test('returns the expected result', async () => {
        expect(result.length).to.equal(1);
        expect(result[0].document_id).to.equal('test-document-id');
      });

      test('creates the expected query filter', async () => {
        const [filter] = documentsConnector.findAll.lastCall.args;
        expect(filter).to.equal({
          includeExpired: false,
          system_external_id: {
            $in: ['test-licence-number']
          }
        });
      });
    });

    experiment('for a expired licence', () => {
      let result;

      beforeEach(async () => {
        documentsConnector.findAll.resolves([{
          document_id: 'test-document-id',
          system_external_id: 'test-licence-number'
        }]);

        result = await documentsConnector.getDocumentsByLicenceNumbers(['test-licence-number'], true);
      });

      test('returns the expected result', async () => {
        expect(result.length).to.equal(1);
        expect(result[0].document_id).to.equal('test-document-id');
      });

      test('creates the expected query filter', async () => {
        const [filter] = documentsConnector.findAll.lastCall.args;
        expect(filter).to.equal({
          includeExpired: true,
          system_external_id: {
            $in: ['test-licence-number']
          }
        });
      });
    });

    experiment('for more than 20 licence numbers', () => {
      let result;
      let licenceNumbers;

      beforeEach(async () => {
        licenceNumbers = Array.from({ length: 21 }, (val, key) => {
          return `licence-number-${key}`;
        });

        documentsConnector.findAll.onFirstCall().resolves([{
          document_id: 'test-document-id-1',
          system_external_id: 'test-licence-number'
        }]);

        documentsConnector.findAll.onSecondCall().resolves([{
          document_id: 'test-document-id-2',
          system_external_id: 'test-licence-number'
        }]);

        result = await documentsConnector.getDocumentsByLicenceNumbers(licenceNumbers);
      });

      test('returns the expected result', async () => {
        expect(result.length).to.equal(2);
        expect(result[0].document_id).to.equal('test-document-id-1');
        expect(result[1].document_id).to.equal('test-document-id-2');
      });

      test('creates the expected query filters split over two calls', async () => {
        const [firstFilter] = documentsConnector.findAll.firstCall.args;
        expect(firstFilter).to.equal({
          system_external_id: {
            $in: licenceNumbers.slice(0, -1)
          },
          includeExpired: false
        });

        const [secondFilter] = documentsConnector.findAll.secondCall.args;
        expect(secondFilter).to.equal({
          system_external_id: {
            $in: licenceNumbers.slice(-1)
          },
          includeExpired: false
        });
      });
    });
  });
});
