const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const repository = require('../../../src/lib/connectors/repository');
const controller = require('../../../src/modules/charge-versions/controller');
const documentConnector = require('../../../src/lib/connectors/crm/documents');

const chargeVersion = {
  charge_version_id: 'b58fd6d2-40b9-4ab8-a860-82eeb218ecdd'
};

const chargeElements = [{
  charge_element_id: '156e4ef4-c975-4ccb-8286-3c2f82a6c9dc'
}, {
  charge_element_id: 'c24a65cc-1a66-45bd-b55e-a2d7d0473988'
}];

const chargeAgreements = [{
  charge_agreement_id: '57e52307-e0a2-4df2-9640-aa4c73d1103a',
  charge_element_id: 'c24a65cc-1a66-45bd-b55e-a2d7d0473988'
}];

experiment('./src/modules/charge-versions/controller.js', () => {
  beforeEach(async () => {
    sandbox.stub(repository.chargeVersions, 'findByLicenceRef')
      .resolves([chargeVersion]);
    sandbox.stub(repository.chargeVersions, 'findOneById')
      .resolves(chargeVersion);
    sandbox.stub(repository.chargeElements, 'findByChargeVersionId')
      .resolves(chargeElements);
    sandbox.stub(repository.chargeAgreements, 'findByChargeVersionId')
      .resolves(chargeAgreements);

    sandbox.stub(documentConnector, 'getDocument');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getChargeVersions', () => {
    let request, response;

    beforeEach(async () => {
      request = {
        query: {
          licenceRef: '01/123'
        }
      };
      response = await controller.getChargeVersions(request);
    });

    test('calls charge versions repo with licence number from query param', async () => {
      expect(repository.chargeVersions.findByLicenceRef.calledWith(
        request.query.licenceRef
      )).to.be.true();
    });

    test('responds with the mapped charge version data', async () => {
      expect(response).to.equal({
        data: [{
          chargeVersionId: chargeVersion.charge_version_id
        }]
      });
    });
  });

  experiment('getChargeVersion', () => {
    let request, response;

    experiment('when the charge version is found', () => {
      beforeEach(async () => {
        request = {
          params: {
            versionId: chargeVersion.charge_version_id
          }
        };
        response = await controller.getChargeVersion(request);
      });

      test('gets data from charge version repository', async () => {
        expect(repository.chargeVersions.findOneById.calledWith(
          request.params.versionId
        )).to.be.true();
      });

      test('gets data from charge elements repository', async () => {
        expect(repository.chargeElements.findByChargeVersionId.calledWith(
          request.params.versionId
        )).to.be.true();
      });

      test('gets data from charge agreements repository', async () => {
        expect(repository.chargeAgreements.findByChargeVersionId.calledWith(
          request.params.versionId
        )).to.be.true();
      });

      test('responds with data mapped to single object', async () => {
        expect(response).to.be.an.object();
      });
    });

    experiment('when the charge version is not found', () => {
      beforeEach(async () => {
        request = {
          params: {
            versionId: chargeVersion.charge_version_id
          }
        };
        repository.chargeVersions.findOneById.resolves();
        response = await controller.getChargeVersion(request);
      });

      test('responds with 404 not found error', async () => {
        expect(response.isBoom).to.equal(true);
        expect(response.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('getChargeVersionsByDocumentId', () => {
    let request, response;

    beforeEach(async () => {
      documentConnector.getDocument.resolves({
        data: {
          system_external_id: 'test-licence-ref'
        }
      });

      request = {
        params: {
          documentId: '00000000-0000-0000-0000-000000000000'
        }
      };
      response = await controller.getChargeVersionsByDocumentId(request);
    });

    test('gets the document using the document id parameter', async () => {
      const [docId] = documentConnector.getDocument.lastCall.args;
      expect(docId).to.equal(request.params.documentId);
    });

    test('calls charge versions repo with licence number from the found document', async () => {
      expect(repository.chargeVersions.findByLicenceRef.calledWith(
        'test-licence-ref'
      )).to.be.true();
    });

    test('responds with the mapped charge version data', async () => {
      expect(response).to.equal({
        data: [{
          chargeVersionId: chargeVersion.charge_version_id
        }]
      });
    });
  });
});
