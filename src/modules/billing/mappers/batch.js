'use strict';

const { pick, pickBy, identity } = require('lodash');

const Batch = require('../../../lib/models/batch');
const FinancialYear = require('../../../lib/models/financial-year');
const regionMapper = require('./region');
const transactionMapper = require('./transaction');
const totalsMapper = require('./totals');

/**
 * @param {Object} row - DB row, camel cased
 * @return {Batch}
 */
const dbToModel = row => {
  const batch = new Batch();
  batch.fromHash({
    id: row.billingBatchId,
    type: row.batchType,
    ...pick(row, ['isSummer', 'status', 'dateCreated', 'dateUpdated', 'errorCode']),
    startYear: new FinancialYear(row.fromFinancialYearEnding),
    endYear: new FinancialYear(row.toFinancialYearEnding),
    ...pickBy({
      region: regionMapper.dbToModel(row.region),
      totals: totalsMapper.dbToModel(row),
      externalId: row.externalId,
      billRunId: row.billRunId
    }, identity)
  });
  return batch;
};

/**
 * @param {Batch} batch
 * @return {Array<Object>} array of transactions to POST to charge module
 */
const modelToChargeModule = batch => {
  return batch.invoices.reduce((acc, invoice) => {
    invoice.invoiceLicences.forEach(invoiceLicence => {
      invoiceLicence.transactions.forEach(transaction => {
        acc.push(transactionMapper.modelToChargeModule(batch, invoice, invoiceLicence, transaction));
      });
    });
    return acc;
  }, []);
};

exports.dbToModel = dbToModel;
exports.modelToChargeModule = modelToChargeModule;
