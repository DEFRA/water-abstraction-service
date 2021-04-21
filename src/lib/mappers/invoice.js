'use strict';

const { omit, isNull } = require('lodash');

const Invoice = require('../models/invoice');
const InvoiceAccount = require('../models/invoice-account');
const FinancialYear = require('../models/financial-year');

const invoiceAccount = require('./invoice-account');
const invoiceLicence = require('../../modules/billing/mappers/invoice-licence');
const batchMapper = require('../../modules/billing/mappers/batch');

const { createMapper } = require('../object-mapper');
const { createModel } = require('./lib/helpers');

const dbToModelMapper = createMapper()
  .copy(
    'dateCreated',
    'invoiceNumber',
    'isCredit',
    'isDeMinimis',
    'invoiceValue',
    'creditNoteValue',
    'externalId',
    'legacyId',
    'metadata',
    'isFlaggedForRebilling',
    'rebillingState'
  )
  .map('netAmount').to('netTotal')
  .map('billingInvoiceId').to('id')
  .map('invoiceAccountId').to('invoiceAccount', invoiceAccountId => new InvoiceAccount(invoiceAccountId))
  .map('invoiceAccountNumber').to('invoiceAccount.accountNumber')
  .map('billingInvoiceLicences').to('invoiceLicences', billingInvoiceLicences => billingInvoiceLicences.map(invoiceLicence.dbToModel))
  .map('billingBatch').to('batch', batchMapper.dbToModel)
  .map('financialYearEnding').to('financialYear', financialYearEnding => new FinancialYear(financialYearEnding))
  .map('originalBillingInvoiceId').to('originalInvoiceId');

/**
 * Converts DB representation to a Invoice service model
 * @param {Object} row
 * @return {Invoice}
 */
const dbToModel = row =>
  createModel(Invoice, row, dbToModelMapper);

const mapAddress = invoice =>
  invoice.address ? omit(invoice.address.toJSON(), 'id') : {};

/**
 * Maps data from an Invoice model to the correct shape for water.billing_invoices
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToDb = (batch, invoice) => ({
  externalId: invoice.externalId || null,
  invoiceAccountId: invoice.invoiceAccount.id,
  invoiceAccountNumber: invoice.invoiceAccount.accountNumber,
  address: mapAddress(invoice),
  billingBatchId: batch.id,
  financialYearEnding: invoice.financialYear.endYear,
  invoiceNumber: invoice.invoiceNumber || null,
  isCredit: isNull(invoice.netTotal) ? null : invoice.netTotal < 0,
  isDeMinimis: invoice.isDeMinimis,
  netAmount: invoice.netTotal,
  invoiceValue: invoice.invoiceValue,
  creditNoteValue: invoice.creditNoteValue,
  isFlaggedForRebilling: invoice.isFlaggedForRebilling,
  rebillingState: invoice.rebillingState,
  originalBillingInvoiceId: invoice.originalInvoiceId
});

const crmToModel = row => {
  const invoice = new Invoice();

  // Create invoice account model
  invoice.invoiceAccount = invoiceAccount.crmToModel(row);

  // Get last address from invoice account
  const { lastInvoiceAccountAddress } = invoice.invoiceAccount;
  if (lastInvoiceAccountAddress) {
    const { address, agentCompany, contact } = lastInvoiceAccountAddress;
    invoice.fromHash({
      address,
      agentCompany: agentCompany || null,
      contact: contact || null
    });
  }

  return invoice;
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
exports.crmToModel = crmToModel;
