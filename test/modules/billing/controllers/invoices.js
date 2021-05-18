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
const { BATCH_STATUS } = require('../../../../src/lib/models/batch');

const invoiceService = require('../../../../src/lib/services/invoice-service');
const controller = require('../../../../src/modules/billing/controllers/invoices');

experiment('modules/billing/controllers/invoices', () => {
  const invoiceId = uuid();

  const createInvoice = (overrides = {}) => ({
    invoiceId,
    billingBatch: {
      status: overrides.batchStatus || BATCH_STATUS.sent
    },
    rebillingState: overrides.rebillingState || null
  });

  beforeEach(() => {
    sandbox.stub(invoiceService, 'getInvoiceById');
    sandbox.stub(invoiceService, 'updateInvoice').resolves(new Invoice(invoiceId));
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
        invoiceService.getInvoiceById.resolves(createInvoice());
        result = await controller.patchInvoice(request);
      });

      test('gets the invoice', () => {
        expect(invoiceService.getInvoiceById.calledWith(invoiceId)).to.be.true();
      });

      test('updates the invoice with the payload', () => {
        expect(invoiceService.updateInvoice.calledWith(
          invoiceId, request.payload
        )).to.be.true();
      });

      test('returns the updated invoice', () => {
        expect(result).to.be.an.instanceOf(Invoice);
      });
    });

    experiment('when the invoice is not part of a sent batch', () => {
      beforeEach(async () => {
        invoiceService.getInvoiceById.resolves(createInvoice({
          batchStatus: BATCH_STATUS.ready
        }));
        result = await controller.patchInvoice(request);
      });

      test('returns Boom conflict error with the expected message', () => {
        expect(result.isBoom).to.be.true();
        expect(result.message).to.equal('Cannot update invoice that is not part of a sent batch');
        expect(result.output.statusCode).to.equal(409);
      });
    });

    experiment('when the invoice is a rebill', () => {
      beforeEach(async () => {
        invoiceService.getInvoiceById.resolves(createInvoice({
          rebillingState: Invoice.rebillingState.rebill
        }));
        result = await controller.patchInvoice(request);
      });

      test('returns Boom conflict error with the expected message', () => {
        expect(result.isBoom).to.be.true();
        expect(result.message).to.equal('Cannot update invoice that is itself a rebill');
        expect(result.output.statusCode).to.equal(409);
      });
    });
  });
});
