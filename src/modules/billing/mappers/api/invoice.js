const objectMapper = require('object-mapper');

const getIsWaterUndertaker = invoiceLicence =>
  invoiceLicence.licence.isWaterUndertaker;

const containsWaterUndertaker = invoiceLicences => {
  return invoiceLicences
    .map(getIsWaterUndertaker)
    .includes(true);
};

const map = {
  id: 'id',
  'invoiceAccount.accountNumber': 'accountNumber',
  'invoiceAccount.company.name': 'name',
  'totals.netTotal': 'netTotal',
  'invoiceLicences[].licence.licenceNumber': 'licenceNumbers[]',
  invoiceLicences: {
    key: 'isWaterUndertaker',
    transform: containsWaterUndertaker
  }
};

/**
 * Maps an invoice to the API invoice list view
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToBatchInvoice = invoice => {
  return objectMapper(invoice, map);
};

exports.modelToBatchInvoices = modelToBatchInvoice;
