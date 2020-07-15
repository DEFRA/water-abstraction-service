'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const repository = require('../../../src/lib/connectors/repository');
const controller = require('../../../src/modules/charge-versions/controller');
const documentConnector = require('../../../src/lib/connectors/crm/documents');
const licencesService = require('../../../src/lib/services/licences');
const chargeElementsService = require('../../../src/lib/services/charge-elements');

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

experiment('modules/charge-versions/controller', () => {
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

    sandbox.stub(licencesService, 'getLicenceVersionById');
    sandbox.stub(chargeElementsService, 'getChargeElementsFromLicenceVersion');
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

  experiment('getDefaultChargesForLicenceVersion', () => {
    experiment('when the licence version is not found', () => {
      let response;
      let licenceVersionId;

      beforeEach(async () => {
        licencesService.getLicenceVersionById.resolves(null);

        const request = {
          params: {
            licenceVersionId: licenceVersionId = uuid()
          }
        };

        response = await controller.getDefaultChargesForLicenceVersion(request);
      });

      test('an attempt to find the licence version is made', async () => {
        const [id] = licencesService.getLicenceVersionById.lastCall.args;
        expect(id).to.equal(licenceVersionId);
      });

      test('a 404 is returned', async () => {
        expect(response.output.statusCode).to.equal(404);
      });
    });

    experiment('when the licence version is found', () => {
      let response;
      let licenceVersionId;

      beforeEach(async () => {
        const request = {
          params: {
            licenceVersionId: licenceVersionId = uuid()
          }
        };

        licencesService.getLicenceVersionById.resolves({ licenceVersionId });
        chargeElementsService.getChargeElementsFromLicenceVersion.resolves([
          { season: 'summer' },
          { season: 'winter' },
          { season: 'all year' }
        ]);

        response = await controller.getDefaultChargesForLicenceVersion(request);
      });

      test('an attempt to find the licence version is made', async () => {
        const [id] = licencesService.getLicenceVersionById.lastCall.args;
        expect(id).to.equal(licenceVersionId);
      });

      test('the licence version is mapped to charge elements', async () => {
        const [licenceVersion] = chargeElementsService.getChargeElementsFromLicenceVersion.lastCall.args;
        expect(licenceVersion.licenceVersionId).to.equal(licenceVersionId);
      });

      test('the mapped charge elements are returned', async () => {
        expect(response).to.equal([
          { season: 'summer' },
          { season: 'winter' },
          { season: 'all year' }
        ]);
      });
    });
  });
});
