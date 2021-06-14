const { BATCH_STATUS } = require('../../../lib/models/batch');
const Boom = require('@hapi/boom');
const invoiceService = require('../../../lib/services/invoice-service');
const mapErrorResponse = require('../../../lib/map-error-response');

const invoiceIsPartOfSentBatch = invoice =>
  invoice.batch.status === BATCH_STATUS.sent;

const invoiceIsRebill = invoice =>
  invoice.rebillingState !== null;

const patchInvoice = async request => {
  try {
    const { invoiceId } = request.params;
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoiceIsPartOfSentBatch(invoice)) {
      return Boom.conflict('Cannot update invoice that is not part of a sent batch');
    }
    if (invoiceIsRebill(invoice)) {
      return Boom.conflict('Cannot update invoice that is itself a rebill');
    }
    // Update and persist Invoice service model
    invoice.fromHash(request.payload);
    return invoiceService.updateInvoice(invoice);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.patchInvoice = patchInvoice;
