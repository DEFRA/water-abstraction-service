'use strict';

const invoiceLicenceService = require('../services/invoice-licences-service');
const mapErrorResponse = require('../../../lib/map-error-response');

const deleteInvoiceLicence = async (request, h) => {
  const { invoiceLicenceId } = request.params;
  try {
    await invoiceLicenceService.deleteByInvoiceLicenceId(invoiceLicenceId);
    return h.response().code(204);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.deleteInvoiceLicence = deleteInvoiceLicence;
