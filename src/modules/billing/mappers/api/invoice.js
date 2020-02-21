const objectMapper = require('object-mapper');

/**
 * Maps an invoice to the API invoice list view
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToBatchInvoice = invoice => {
  const map = {
    id: 'id',
    'invoiceAccount.accountNumber': 'accountNumber',
    'invoiceAccount.company.name': 'name',
    'totals.netTotal': 'netTotal',
    'invoiceLicences[].licence.licenceNumber': 'licenceNumbers[]'
  };
  return objectMapper(invoice, map);
};

exports.modelToBatchInvoices = modelToBatchInvoice;
