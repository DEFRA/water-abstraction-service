'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const Invoice = require('../../../../src/lib/models/invoice');

const invoiceService = require('../../../../src/lib/services/invoice-service');
const controller = require('../../../../src/modules/billing/controllers/invoices');

const { NotFoundError } = require('../../../../src/lib/errors');

experiment('modules/billing/controllers/invoices', () => {
  const invoiceId = uuid();

  beforeEach(() => {
    sandbox.stub(invoiceService, 'setIsFlaggedForRebilling');
  });

  afterEach(() => sandbox.restore());

  experiment('.patchInvoice', () => {
    const request = {
      params: { invoiceId },
      payload: {
        isFlaggedForRebilling: true
      }
    };
    let result;
    experiment('happy path', () => {
      beforeEach(async () => {
        invoiceService.setIsFlaggedForRebilling.resolves(new Invoice(invoiceId));
        result = await controller.patchInvoice(request);
      });

      test('calls the service method', () => {
        expect(invoiceService.setIsFlaggedForRebilling.calledWith(
          invoiceId, true
        )).to.be.true();
      });

      test('resolves with an invoice', () => {
        expect(result).to.be.an.an.instanceOf(Invoice);
      });
    });

    experiment('when there is a service error', () => {
      beforeEach(async () => {
        invoiceService.setIsFlaggedForRebilling.rejects(new NotFoundError());
        result = await controller.patchInvoice(request);
      });

      test('returns Boom error with the expected message', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });
});
