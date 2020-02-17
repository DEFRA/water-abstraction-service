'use strict';

const { pick, compact, pickBy } = require('lodash');

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
  const totals = totalsMapper.dbToModel(row);
  const { externalId } = row;
  batch.fromHash({
    id: row.billingBatchId,
    type: row.batchType,
    ...pick(row, ['season', 'status', 'dateCreated', 'dateUpdated']),
    startYear: new FinancialYear(row.fromFinancialYearEnding),
    endYear: new FinancialYear(row.toFinancialYearEnding),
    region: regionMapper.dbToModel(row.region),
    ...totals && { totals },
    ...externalId && { externalId }
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
