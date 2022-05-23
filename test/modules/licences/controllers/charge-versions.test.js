'use strict';

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const {
  afterEach,
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const controller = require('../../../../src/lib/controller');
const chargeVersionsController = require('../../../../src/modules/licences/controllers/charge-versions');
const chargeVersionsService = require('../../../../src/lib/services/charge-versions');

const sandbox = require('sinon').createSandbox();

experiment('modules/licences/controllers/charge-versions', () => {
  beforeEach(async () => {
    sandbox.stub(controller, 'getEntities');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getLicenceChargeVersions', () => {
    let request;
    let result;
    let licenceId;

    beforeEach(async () => {
      controller.getEntities.resolves([{ id: 'test-id' }]);
      licenceId = uuid();
      request = {
        params: {
          licenceId
        }
      };

      result = await chargeVersionsController.getLicenceChargeVersions(request);
    });

    test('passes the licence id to the controller helper', async () => {
      const [id] = controller.getEntities.lastCall.args;
      expect(id).to.equal(request.params.licenceId);
    });

    test('passes the expected service function to the controller helper', async () => {
      const [, func] = controller.getEntities.lastCall.args;
      expect(func).to.equal(chargeVersionsService.getByLicenceId);
    });

    test('returns the result from the controller helper', async () => {
      expect(result).to.equal([{ id: 'test-id' }]);
    });
  });
});
