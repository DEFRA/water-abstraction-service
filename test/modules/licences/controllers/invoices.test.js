'use strict';

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const {
  afterEach,
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { logger } = require('../../../../src/logger');
const licenceService = require('../../../../src/lib/services/licences');
const invoicesController = require('../../../../src/modules/licences/controllers/invoices');

const sandbox = require('sinon').createSandbox();

experiment('modules/licences/controllers/invoices', () => {
  beforeEach(async () => {
    sandbox.stub(licenceService, 'getLicenceInvoices');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getLicenceInvoices', () => {
    const licenceId = uuid();
    const request = {
      params: {
        licenceId
      },
      query: {
        page: 1,
        perPage: 10
      }
    };

    experiment('when request is valid', () => {
      beforeEach(async () => {
        await licenceService.getLicenceInvoices.resolves([]);

        await invoicesController.getLicenceInvoices(request);
      });
      afterEach(() => {
        sandbox.restore();
      });
      test('calls the licences service with the correct params', async () => {
        const [id, page, perPage] = licenceService.getLicenceInvoices.lastCall.args;
        expect(id).to.equal(licenceId);
        expect(page).to.equal(1);
        expect(perPage).to.equal(10);
      });
    });

    experiment('when request is not valid', () => {
      beforeEach(async () => {
        await licenceService.getLicenceInvoices.throws({
          statusCode: 404,
          name: 'some name',
          message: 'not found'
        });
        await invoicesController.getLicenceInvoices(request);
      });
      afterEach(() => {
        sandbox.restore();
      });
      test('calls the logger', async () => {
        expect(logger.error.called).to.be.true();
      });
    });
  });
});
