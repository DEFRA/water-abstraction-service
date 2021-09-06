'use strict';

const invoiceService = require('../../../lib/services/invoice-service');
const mapErrorResponse = require('../../../lib/map-error-response');

const patchInvoice = async request => {
  try {
    const { invoiceId } = request.params;
    const { isFlaggedForRebilling } = request.payload;

    return await invoiceService.setIsFlaggedForRebilling(invoiceId, isFlaggedForRebilling);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

const resetIsFlaggedForRebilling = async request => {
  try {
    const { batchId } = request.params;

    return await invoiceService.resetIsFlaggedForRebilling(batchId);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

const resetIsFlaggedForRebillingByInvoiceId = async request => {
  try {
    const { originalInvoiceId, rebillInvoiceId } = request.params;
    // If the originalInvoiceId and rebillInvoiceId (rebill or reversal) is not null then
    // remove rebill/reissue flag in the water service for the original invoice id
    if (originalInvoiceId !== null && rebillInvoiceId !== null) {
      return await invoiceService.resetIsFlaggedForRebillingByInvoiceId(originalInvoiceId);
    }
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.resetIsFlaggedForRebilling = resetIsFlaggedForRebilling;
exports.resetIsFlaggedForRebillingByInvoiceId = resetIsFlaggedForRebillingByInvoiceId;
exports.patchInvoice = patchInvoice;
