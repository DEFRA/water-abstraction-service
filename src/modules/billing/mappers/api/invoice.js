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
  'financialYear.yearEnding': 'financialYearEnding',
  invoiceLicences: [{
    key: 'isWaterUndertaker',
    transform: containsWaterUndertaker
  }]
};

/**
 * Maps an invoice to the API invoice list view
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToBatchInvoice = invoice => {
  const mappedInvoice = objectMapper(invoice, map);
  objectMapper.setKeyValue(mappedInvoice, 'isMinimumChargeApplied', invoice.isMinimumChargeApplied());
  return mappedInvoice;
};

exports.modelToBatchInvoices = modelToBatchInvoice;
