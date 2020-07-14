'use strict';

const { omit, pick } = require('lodash');

const Invoice = require('../../../lib/models/invoice');
const InvoiceAccount = require('../../../lib/models/invoice-account');
const FinancialYear = require('../../../lib/models/financial-year');

const invoiceAccount = require('../../../lib/mappers/invoice-account');
const invoiceLicence = require('./invoice-licence');

/**
 * @param {Object} row - camel cased
 * @return {Invoice}
 */
const dbToModel = row => {
  const invoice = new Invoice(row.billingInvoiceId);
  invoice.dateCreated = row.dateCreated;

  invoice.invoiceAccount = new InvoiceAccount(row.invoiceAccountId);
  invoice.invoiceAccount.accountNumber = row.invoiceAccountNumber;

  if (row.billingInvoiceLicences) {
    invoice.invoiceLicences = row.billingInvoiceLicences.map(invoiceLicence.dbToModel);
  }

  invoice.financialYear = new FinancialYear(row.financialYearEnding);

  return invoice;
};

/**
 * Maps data from an Invoice model to the correct shape for water.billing_invoices
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToDb = (batch, invoice) => ({
  invoiceAccountId: invoice.invoiceAccount.id,
  invoiceAccountNumber: invoice.invoiceAccount.accountNumber,
  address: omit(invoice.address.toObject(), 'id'),
  billingBatchId: batch.id,
  financialYearEnding: invoice.financialYear.endYear
});

const crmToModel = row => {
  const invoice = new Invoice();

  // Create invoice account model
  invoice.invoiceAccount = invoiceAccount.crmToModel(row);

  // Get last address from invoice account
  const { lastInvoiceAccountAddress } = invoice.invoiceAccount;
  if (lastInvoiceAccountAddress) {
    invoice.fromHash(pick(lastInvoiceAccountAddress, ['address', 'agentCompany', 'contact']));
  }

  return invoice;
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
exports.crmToModel = crmToModel;
