'use strict';

const { expect } = require('@hapi/code');
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();

const controller = require('../../../src/modules/invoice-accounts/controller');
const invoiceAccountService = require('../../../src/lib/services/invoice-accounts-service');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');

const sandbox = require('sinon').createSandbox();

experiment('modules/licences/controllers/licences.js', () => {
  beforeEach(async () => {
    sandbox.stub(invoiceAccountService, 'getByInvoiceAccountId');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getLicence', () => {
    let request, result;

    beforeEach(async () => {
      request = {
        params: {
          invoiceAccountId: 'test-id'
        }
      };
    });
    experiment('when the licence exists', () => {
      beforeEach(async () => {
        invoiceAccountService.getByInvoiceAccountId.resolves(new InvoiceAccount());
        result = await controller.getInvoiceAccount(request);
      });

      test('the licence ID is passed to the service', async () => {
        expect(invoiceAccountService.getByInvoiceAccountId.calledWith('test-id')).to.be.true();
      });

      test('resolves with a licence model', async () => {
        expect(result instanceof InvoiceAccount).to.be.true();
      });
    });

    experiment('when the licence does not exist', () => {
      beforeEach(async () => {
        invoiceAccountService.getByInvoiceAccountId.resolves(null);
        result = await controller.getInvoiceAccount(request);
      });

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });
});
