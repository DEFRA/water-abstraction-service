'use strict';

const { omit } = require('lodash');

const Invoice = require('../../../lib/models/invoice');
const InvoiceAccount = require('../../../lib/models/invoice-account');

// Mappers
const address = require('./address');
const invoiceAccount = require('./invoice-account');
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
  billingBatchId: batch.id
});

const crmToModel = row => {
  const invoice = new Invoice();

  // Create invoice account model
  invoice.invoiceAccount = invoiceAccount.crmToModel(row);

  // Create invoice address model
  invoice.address = address.crmToModel(row.address);

  return invoice;
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
exports.crmToModel = crmToModel;
