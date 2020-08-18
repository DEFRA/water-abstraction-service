'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const controller = require('../../../src/modules/charge-versions/controller');
const documentConnector = require('../../../src/lib/connectors/crm/documents');
const licencesService = require('../../../src/lib/services/licences');
const chargeElementsService = require('../../../src/lib/services/charge-elements');
const chargeVersionsService = require('../../../src/lib/services/charge-versions');

const ChargeVersion = require('../../../src/lib/models/charge-version');

experiment('modules/charge-versions/controller', () => {
  let chargeVersions;

  beforeEach(async () => {
    chargeVersions = [
      new ChargeVersion(uuid()),
      new ChargeVersion(uuid())
    ];

    sandbox.stub(chargeVersionsService, 'getByLicenceRef').resolves(chargeVersions);
    sandbox.stub(chargeElementsService, 'getChargeElementsFromLicenceVersion');
    sandbox.stub(chargeVersionsService, 'getByChargeVersionId').resolves(chargeVersions[0]);
    sandbox.stub(documentConnector, 'getDocument');
    sandbox.stub(licencesService, 'getLicenceVersionById');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getChargeVersion', () => {
    let request;
    let response;

    experiment('when the charge version is found', () => {
      beforeEach(async () => {
        request = {
          params: {
            versionId: chargeVersions[0].id
          }
        };
        response = await controller.getChargeVersion(request);
      });

      test('gets data from charge version service', async () => {
        const [id] = chargeVersionsService.getByChargeVersionId.lastCall.args;
        expect(id).to.equal(chargeVersions[0].id);
      });

      test('responds with the expected data', async () => {
        expect(response).to.equal(chargeVersions[0]);
      });
    });

    experiment('when the charge version is not found', () => {
      beforeEach(async () => {
        request = {
          params: {
            versionId: chargeVersions[0].id
          }
        };
        chargeVersionsService.getByChargeVersionId.resolves(null);
        response = await controller.getChargeVersion(request);
      });

      test('responds with 404 not found error', async () => {
        expect(response.isBoom).to.equal(true);
        expect(response.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('getChargeVersionsByDocumentId', () => {
    let request;
    let response;

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

    test('calls charge versions service with licence number from the found document', async () => {
      const [licenceRef] = await chargeVersionsService.getByLicenceRef.lastCall.args;
      expect(licenceRef).to.equal('test-licence-ref');
    });

    test('responds with the charge version data', async () => {
      expect(response).to.equal({
        data: chargeVersions
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
