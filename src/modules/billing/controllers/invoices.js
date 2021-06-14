'use strict';

const Boom = require('@hapi/boom');
const invoiceService = require('../../../lib/services/invoice-service');
const mapErrorResponse = require('../../../lib/map-error-response');

const invoiceIsSent = invoice =>
  invoice.invoiceNumber !== null;

const invoiceIsRebill = invoice =>
  invoice.rebillingState !== null;

const patchInvoice = async request => {
  try {
    const { invoiceId } = request.params;
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoiceIsSent(invoice)) {
      return Boom.conflict('Cannot update invoice that is not sent');
    }
    if (invoiceIsRebill(invoice)) {
      return Boom.conflict('Cannot update invoice that is itself a rebill');
    }
    return invoiceService.updateInvoice(invoiceId, request.payload);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.patchInvoice = patchInvoice;
