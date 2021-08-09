'use strict';

const Batch = require('../../../lib/models/batch');
const FinancialYear = require('../../../lib/models/financial-year');
const regionMapper = require('../../../lib/mappers/region');
const transactionMapper = require('./transaction');
const invoiceMapper = require('../../../lib/mappers/invoice');

const { createMapper } = require('../../../lib/object-mapper');
const helpers = require('../../../lib/mappers/lib/helpers');

const dbToModelMapper = createMapper({ mapNull: false })
  .copy(
    'isSummer',
    'status',
    'dateCreated',
    'dateUpdated',
    'errorCode',
    'externalId',
    'billRunNumber',
    'invoiceCount',
    'netTotal',
    'invoiceValue',
    'creditNoteCount',
    'source'
  )
  .map('creditNoteValue').to('creditNoteValue', value => -Math.abs(value))
  .map('billingBatchId').to('id')
  .map('batchType').to('type')
  .map('fromFinancialYearEnding').to('startYear', fromFinancialYearEnding => new FinancialYear(fromFinancialYearEnding))
  .map('toFinancialYearEnding').to('endYear', toFinancialYearEnding => new FinancialYear(toFinancialYearEnding))
  .map('region').to('region', regionMapper.dbToModel)
  .map('billingInvoices').to('invoices', invoices => invoices.map(invoiceMapper.dbToModel));

/**
 * Converts DB representation to a Batch service model
 * @param {Object} row
 * @return {Batch}
 */
const dbToModel = row =>
  helpers.createModel(Batch, row, dbToModelMapper);

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
