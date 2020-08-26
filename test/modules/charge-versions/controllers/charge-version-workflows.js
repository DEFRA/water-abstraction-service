'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

// Services
const licencesService = require('../../../../src/lib/services/licences');
const chargeVersionWorkflowService = require('../../../../src/modules/charge-versions/services/charge-version-workflows');

// Models
const ChargeVersion = require('../../../../src/lib/models/charge-version');
const Licence = require('../../../../src/lib/models/licence');
const User = require('../../../../src/lib/models/user');
const ChargeVersionWorkflow = require('../../../../src/lib/models/charge-version-workflow');

// Controllers
const controller = require('../../../../src/lib/controller');
const cvWorkflowsController = require('../../../../src/modules/charge-versions/controllers/charge-version-workflow');

// Mappers
const apiMapper = require('../../../../src/modules/charge-versions/mappers/api-mapper');

// Errors
const { NotFoundError, InvalidEntityError } = require('../../../../src/lib/errors');

experiment('modules/charge-versions/controllers/charge-version-workflows', () => {
  beforeEach(async () => {
    sandbox.stub(controller, 'getEntities');
    sandbox.stub(controller, 'getEntity');

    sandbox.stub(licencesService, 'getLicenceById');

    sandbox.stub(chargeVersionWorkflowService, 'create');
    sandbox.stub(chargeVersionWorkflowService, 'update');
    sandbox.stub(chargeVersionWorkflowService, 'delete');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getChargeVersionWorkflows', () => {
    beforeEach(async () => {
      await cvWorkflowsController.getChargeVersionWorkflows();
    });

    test('delegates to controller.getEntities', async () => {
      const [id, serviceFunc, mapper] = controller.getEntities.lastCall.args;
      expect(id).to.be.null();
      expect(serviceFunc).to.equal(chargeVersionWorkflowService.getAllWithLicenceHolder);
      expect(mapper).to.equal(apiMapper.rowToAPIList);
    });
  });

  experiment('.getChargeVersionWorkflow', () => {
    const request = {
      params: {
        chargeVersionWorkflowId: uuid()
      }
    };

    beforeEach(async () => {
      await cvWorkflowsController.getChargeVersionWorkflow(request);
    });

    test('delegates to controller.getEntity', async () => {
      const [id, serviceFunc] = controller.getEntity.lastCall.args;
      expect(id).to.be.equal(request.params.chargeVersionWorkflowId);
      expect(serviceFunc).to.equal(chargeVersionWorkflowService.getByIdWithLicenceHolder);
    });
  });

  experiment('.postChargeVersionWorkflow', () => {
    let result, request;

    beforeEach(async () => {
      request = {
        defra: {
          internalCallingUser: {
            id: 123,
            email: 'mail@example.com'
          }
        },
        payload: {
          licenceId: 'test-licence-id',
          chargeVersion: {
            dateRange: {
              startDate: '2020-09-01'
            }
          }
        },
        pre: {
          chargeVersion: new ChargeVersion(uuid()),
          user: new User(123, 'mail@example.com')
        }
      };

      licencesService.getLicenceById.resolves(new Licence());
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        licencesService.getLicenceById.resolves();
        result = await cvWorkflowsController.postChargeVersionWorkflow(request);
      });

      test('a 404 response is generated', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Licence test-licence-id not found');
      });
    });

    experiment('when all submitted data is valid', async () => {
      beforeEach(async () => {
        await cvWorkflowsController.postChargeVersionWorkflow(request);
      });

      test('the charge version workflow service creates the record', async () => {
        const [licence, chargeVersion, user] = chargeVersionWorkflowService.create.lastCall.args;
        expect(licence).to.be.an.instanceof(Licence);
        expect(chargeVersion).to.equal(request.pre.chargeVersion);
        expect(user).to.be.equal(request.pre.user);
      });
    });
  });

  experiment('.patchChargeVersionWorkflow', () => {
    let request, response;

    beforeEach(async () => {
      request = {
        params: {
          chargeVersionWorkflowId: uuid()
        },
        pre: {
          chargeVersion: new ChargeVersion(uuid())
        },
        payload: {
          status: 'draft',
          approverComments: 'Pull your socks up'
        }
      };
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        chargeVersionWorkflowService.update.resolves(
          new ChargeVersionWorkflow()
        );
        response = await cvWorkflowsController.patchChargeVersionWorkflow(request);
      });

      test('the service update() method is called with the correct ID and params', async () => {
        expect(chargeVersionWorkflowService.update.calledWith(
          request.params.chargeVersionWorkflowId,
          {
            status: 'draft',
            approverComments: 'Pull your socks up',
            chargeVersion: request.pre.chargeVersion
          }
        )).to.be.true();
      });

      test('resolves with the ChargeVersionWorkflow model', async () => {
        expect(response).to.be.an.instanceof(ChargeVersionWorkflow);
      });
    });

    experiment('when the record is not found', () => {
      beforeEach(async () => {
        chargeVersionWorkflowService.update.rejects(
          new NotFoundError()
        );
        response = await cvWorkflowsController.patchChargeVersionWorkflow(request);
      });

      test('the error is mapped to a suitable Boom error', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(404);
      });
    });

    experiment('when there is a mapping error', () => {
      beforeEach(async () => {
        chargeVersionWorkflowService.update.rejects(
          new InvalidEntityError()
        );
        response = await cvWorkflowsController.patchChargeVersionWorkflow(request);
      });

      test('the error is mapped to a suitable Boom error', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(422);
      });
    });
  });

  experiment('.deleteChargeVersionWorkflow', () => {
    let request, response, h;

    beforeEach(async () => {
      request = {
        params: {
          chargeVersionWorkflowId: uuid()
        }
      };
      h = {
        code: sandbox.stub(),
        response: sandbox.stub().returnsThis()
      };
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        chargeVersionWorkflowService.delete.resolves();
        response = await cvWorkflowsController.deleteChargeVersionWorkflow(request, h);
      });

      test('the service delete() method is called with the correct ID', async () => {
        expect(chargeVersionWorkflowService.delete.calledWith(
          request.params.chargeVersionWorkflowId
        )).to.be.true();
      });

      test('responds with a 204 HTTP code', async () => {
        expect(h.code.calledWith(204)).to.be.true();
      });
    });

    experiment('when the record is not found', () => {
      beforeEach(async () => {
        chargeVersionWorkflowService.delete.rejects(
          new NotFoundError()
        );
        response = await cvWorkflowsController.deleteChargeVersionWorkflow(request);
      });

      test('the error is mapped to a suitable Boom error', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(404);
      });
    });
  });
});
