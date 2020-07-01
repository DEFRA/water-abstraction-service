'use strict';

const { expect } = require('@hapi/code');
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();

const controller = require('../../../../src/modules/licences/controllers/licences');
const licencesService = require('../../../../src/lib/services/licences');
const Licence = require('../../../../src/lib/models/licence');

const sandbox = require('sinon').createSandbox();

experiment('modules/licences/controllers/licences.js', () => {
  beforeEach(async () => {
    sandbox.stub(licencesService, 'getLicenceById');
    sandbox.stub(licencesService, 'getLicenceVersions');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getLicence', () => {
    let request, result;

    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-id'
        }
      };
    });

    experiment('when the licence exists', () => {
      beforeEach(async () => {
        licencesService.getLicenceById.resolves(new Licence());
        result = await controller.getLicence(request);
      });

      test('the licence ID is passed to the service', async () => {
        expect(licencesService.getLicenceById.calledWith('test-id')).to.be.true();
      });

      test('resolves with a licence model', async () => {
        expect(result instanceof Licence).to.be.true();
      });
    });

    experiment('when the licence does not exist', () => {
      beforeEach(async () => {
        licencesService.getLicenceById.resolves(null);
        result = await controller.getLicence(request);
      });

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('.getLicenceVersions', () => {
    let result;
    let request;
    let licenceVersions;

    beforeEach(async () => {
      licenceVersions = [
        { licenceVersionId: '1' },
        { licenceVersionId: '2' }
      ];

      licencesService.getLicenceVersions.resolves(licenceVersions);

      request = {
        params: {
          licenceId: 'test-licence-id'
        }
      };

      result = await controller.getLicenceVersions(request);
    });

    test('passes the licence id to the service layer', async () => {
      const [id] = licencesService.getLicenceVersions.lastCall.args;
      expect(id).to.equal(request.params.licenceId);
    });

    test('returns the licence versions', async () => {
      expect(result).to.equal(licenceVersions);
    });
  });
});
