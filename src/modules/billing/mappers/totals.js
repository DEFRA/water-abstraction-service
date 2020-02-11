const Totals = require('../../../lib/models/totals');

const chargeModuleBatchSummaryToModel = data => {
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

const chargeModuleSummaryByFinancialYearToModel = arr => {
  const data = sumProperties(arr);
  const totals = new Totals();
  return totals.pickFrom(data, [
    'creditLineCount',
    'creditLineValue',
    'debitLineCount',
    'debitLineValue',
    'netTotal'
  ]);
};

exports.chargeModuleBatchSummaryToModel = chargeModuleBatchSummaryToModel;
exports.chargeModuleSummaryByFinancialYearToModel = chargeModuleSummaryByFinancialYearToModel;
