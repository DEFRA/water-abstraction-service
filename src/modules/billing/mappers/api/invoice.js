const objectMapper = require('object-mapper');
const { flatMap } = require('lodash');

const getIsWaterUndertaker = invoiceLicence =>
  invoiceLicence.licence.isWaterUndertaker;

const containsWaterUndertaker = invoiceLicences => {
  return invoiceLicences
    .map(getIsWaterUndertaker)
    .includes(true);
};

const doesMinimumChargeApply = invoiceLicences => {
  const transactions = flatMap(invoiceLicences.map(invoiceLicence => invoiceLicence.transactions));
  return transactions.some(trans => trans.isMinimumCharge);
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
  }, {
    key: 'minimumChargeApplies',
    transform: doesMinimumChargeApply
  }
  ]
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
