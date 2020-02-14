const { find } = require('lodash');
const Totals = require('../../../lib/models/totals');

const chargeModuleBillRunToBatchModel = data => {
  const totals = new Totals();
  return totals.pickFrom(data, [
    'creditNoteCount',
    'creditNoteValue',
    'invoiceCount',
    'invoiceValue',
    'creditLineCount',
    'creditLineValue',
    'debitLineCount',
    'debitLineValue',
    'netTotal'
  ]);
};

const sumProperties = arr => arr.reduce((acc, row) => {
  return {
    creditLineCount: acc.creditLineCount + row.creditLineCount,
    creditLineValue: acc.creditLineValue + row.creditLineValue,
    debitLineCount: acc.debitLineCount + row.debitLineCount,
    debitLineValue: acc.debitLineValue + row.debitLineValue,
    netTotal: acc.netTotal + row.netTotal
  };
}, {
  creditLineCount: 0,
  creditLineValue: 0,
  debitLineCount: 0,
  debitLineValue: 0,
  netTotal: 0
});

/**
 * Sums all transaction summaries for the supplied invoice account
 * number and returns as a Totals instance
 * @param {Object} billRun - response from Charge Module bill run call
 * @param {String} invoiceAccountNumber
 * @return {Totals} - totals for the supplied invoice account
 */
const chargeModuleBillRunToInvoiceModel = (billRun, invoiceAccountNumber) => {
  const customer = find(billRun.customers, row => row.customerReference === invoiceAccountNumber);
  if (!customer) {
    return null;
  }
  const data = sumProperties(customer.summaryByFinancialYear);
  const totals = new Totals();
  return totals.pickFrom(data, [
    'creditLineCount',
    'creditLineValue',
    'debitLineCount',
    'debitLineValue',
    'netTotal'
  ]);
};

exports.chargeModuleBillRunToBatchModel = chargeModuleBillRunToBatchModel;
exports.chargeModuleBillRunToInvoiceModel = chargeModuleBillRunToInvoiceModel;
