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

/**
 * Sums all transaction summaries for the supplied invoice account
 * number and returns as a Totals instance
 * @param {Object} cmResponse - response from Charge Module bill run call
 * @param {String} invoiceAccountNumber
 * @param {Number} financialYearEnding
 * @return {Totals} - totals for the supplied invoice account
 */
const chargeModuleBillRunToInvoiceModel = (cmResponse, invoiceAccountNumber, financialYearEnding) => {
  const customer = find(cmResponse.billRun.customers, { customerReference: invoiceAccountNumber });
  if (!customer) {
    return null;
  }
  const finYear = find(customer.summaryByFinancialYear, { financialYear: financialYearEnding - 1 });
  if (!finYear) {
    return null;
  }
  const totals = new Totals();
  return totals.pickFrom(finYear, [
    'creditLineCount',
    'creditLineValue',
    'debitLineCount',
    'debitLineValue',
    'netTotal'
  ]);
};

/**
 * Maps a partial set of fields in water.billing_batches table to a Totals model
 * @param {Object} row - row of data from water.billing_batches table
 * @return {Totals}
 */
const dbToModel = row => {
  if (row.netTotal === null) {
    return null;
  }
  const totals = new Totals();
  totals.pickFrom(row, ['creditNoteCount', 'invoiceCount', 'netTotal']);
  return totals;
};

exports.chargeModuleBillRunToBatchModel = chargeModuleBillRunToBatchModel;
exports.chargeModuleBillRunToInvoiceModel = chargeModuleBillRunToInvoiceModel;
exports.dbToModel = dbToModel;
