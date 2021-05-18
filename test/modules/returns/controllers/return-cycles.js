'use strict';

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();

const controller = require('../../../../src/lib/controller');
const returnCyclesController = require('../../../../src/modules/returns/controllers/return-cycles');
const returnCyclesService = require('../../../../src/lib/services/return-cycles');

experiment('modules/returns/controllers/controller', () => {
  let request, response;

  beforeEach(async () => {
    request = {
      params: {
        returnCycleId: 'some-id'
      },
      pre: {
        returnCycle: {
          returnCycleId: 'some-id'
        }
      }
    };

    sandbox.stub(controller, 'getEntities');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturnCyclesReport', () => {
    beforeEach(async () => {
      returnCyclesController.getReturnCyclesReport();
    });

    test('delegates to getReturnCycleReport service method', async () => {
      expect(controller.getEntities.calledWith(
        null, returnCyclesService.getReturnCycleReport
      )).to.be.true();
    });
  });

  experiment('.getReturnCycle', () => {
    beforeEach(async () => {
      response = returnCyclesController.getReturnCycle(request);
    });

    test('returns the return cycle from request.pre', async () => {
      expect(response).to.equal(request.pre.returnCycle);
    });
  });

  experiment('.getReturnCycleReturns', () => {
    beforeEach(async () => {
      await returnCyclesController.getReturnCycleReturns(request);
    });

    test('delegates to getReturnCycleReport service method', async () => {
      expect(controller.getEntities.calledWith(
        request.params.returnCycleId, returnCyclesService.getReturnCycleReturns
      )).to.be.true();
    });
  });
});
