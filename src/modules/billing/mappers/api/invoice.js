const objectMapper = require('object-mapper');

const modelToBatchInvoice = invoices => {
  const map = {
    id: 'id',
    'invoiceAccount.accountNumber': 'accountNumber',
    'invoiceAccount.company.name': 'name',
    'totals.netTotal': 'netTotal',
    'invoiceLicences[].licence.licenceNumber': 'licenceNumbers[]'
  };
  return objectMapper(invoices, map);
};

exports.modelToBatchInvoices = modelToBatchInvoice;
