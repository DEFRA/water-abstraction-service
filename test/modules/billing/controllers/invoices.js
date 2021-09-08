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
  const batchId = uuid();

  beforeEach(() => {
    sandbox.stub(invoiceService, 'setIsFlaggedForRebilling');
    sandbox.stub(invoiceService, 'resetIsFlaggedForRebilling');
    sandbox.stub(invoiceService, 'resetIsFlaggedForRebillingByInvoiceId');
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
  experiment('.resetIsFlaggedForRebilling by batchId', () => {
    const request = {
      params: { batchId }
    };
    let result;
    experiment('happy reset', () => {
      beforeEach(async () => {
        invoiceService.resetIsFlaggedForRebilling.resolves(new Invoice(invoiceId));
        result = await controller.resetIsFlaggedForRebilling(request);
      });

      test('calls the service method', () => {
        expect(invoiceService.resetIsFlaggedForRebilling.calledWith(
          batchId
        )).to.be.true();
      });

      test('resolves with an invoice', () => {
        expect(result).to.be.an.an.instanceOf(Invoice);
      });
    });

    experiment('when there is a service error', () => {
      beforeEach(async () => {
        invoiceService.resetIsFlaggedForRebilling.rejects(new NotFoundError());
        result = await controller.resetIsFlaggedForRebilling(request);
      });

      test('returns Boom error with the expected message', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });
  experiment('.resetIsFlaggedForRebilling by InvoiceId', () => {
    let originalInvoiceId = uuid();
    const request = {
      params: { originalInvoiceId }
    };
    let result;
    experiment('happy reset', () => {
      beforeEach(async () => {
        invoiceService.resetIsFlaggedForRebillingByInvoiceId.resolves(new Invoice(invoiceId));
        result = await controller.resetIsFlaggedForRebillingByInvoiceId(request);
      });

      test('calls the service method', () => {
        expect(invoiceService.resetIsFlaggedForRebillingByInvoiceId.calledWith(
          originalInvoiceId
        )).to.be.true();
      });

      test('resolves with an invoice', () => {
        expect(result).to.be.an.an.instanceOf(Invoice);
      });
    });

    experiment('when there is a service error', () => {
      beforeEach(async () => {
        invoiceService.resetIsFlaggedForRebillingByInvoiceId.rejects(new NotFoundError());
        result = await controller.resetIsFlaggedForRebillingByInvoiceId(request);
      });

      test('returns Boom error with the expected message', () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });  
});
