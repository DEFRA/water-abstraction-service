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

    let result;

    experiment('when request is valid', () => {
      beforeEach(async () => {
        licenceService.getLicenceInvoices.resolves([]);

        result = await invoicesController.getLicenceInvoices(request);
      });

      test('calls the licences service with the correct params', async () => {
        const [id] = licenceService.getLicenceInvoices.lastCall.args;
        expect(id).to.equal(licenceId);
      });
    });

    experiment('when request is not valid', () => {
      beforeEach(async () => {
        licenceService.getLicenceInvoices.rejects('some error');

        result = await invoicesController.getLicenceInvoices(request);
      });
      test('calls the logger', () => {
        expect(logger.error.called).to.be.true();
      });
      test('returns boom error', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(500);
      });
    });
  });
});
