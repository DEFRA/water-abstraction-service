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

exports.patchInvoice = patchInvoice;
