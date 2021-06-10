'use strict';

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();

const controllerHelper = require('../../../../src/lib/controller');
const controller = require('../../../../src/modules/billing/controllers/invoice-licences');
const invoiceLicencesService = require('../../../../src/modules/billing/services/invoice-licences-service');

experiment('modules/billing/controllers/invoice-licences', () => {
  let request, h;

  beforeEach(async () => {
    sandbox.stub(controllerHelper, 'deleteEntity');
    h = {};
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.deleteInvoiceLicence', () => {
    const invoiceLicenceId = 'test-id';

    beforeEach(async () => {
      request = {
        params: {
          invoiceLicenceId
        }
      };
      await controller.deleteInvoiceLicence(request, h);
    });

    test('calls the deleteEntity controller helper', async () => {
      expect(controllerHelper.deleteEntity.calledWith(
        invoiceLicencesService.deleteByInvoiceLicenceId,
        h,
        invoiceLicenceId
      )).to.be.true();
    });
  });
});
