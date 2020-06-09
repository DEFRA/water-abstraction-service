const { expect } = require('@hapi/code');
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();

const controller = require('../../../../src/modules/licences/controllers/licences');
const licencesService = require('../../../../src/lib/services/licences');
const Licence = require('../../../../src/lib/models/licence');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('modules/licences/controllers/licences.js', () => {
  beforeEach(async () => {
    sandbox.stub(licencesService, 'getLicenceById');
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
});
