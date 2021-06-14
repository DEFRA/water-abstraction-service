'use strict';

const { createMapper } = require('../../../lib/object-mapper');
const { createModel } = require('../../../lib/mappers/lib/helpers');

const InvoiceLicence = require('../../../lib/models/invoice-licence');

// Mappers
const transaction = require('./transaction');
const licence = require('../../../lib/mappers/licence');

const mapBillingTransactions = billingTransactions =>
  billingTransactions.map(transaction.dbToModel);

const dbToModelMapper = createMapper()
  .map('billingInvoiceLicenceId').to('id')
  .map('licence').to('licence', licence.dbToModel)
  .map('billingTransactions').to('transactions', mapBillingTransactions)
  .map('billingInvoiceId').to('invoiceId');

const dbToModel = row => createModel(InvoiceLicence, row, dbToModelMapper);

/**
 * Maps data from an InvoiceLicence model to the correct shape for water.billing_invoice_licences
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToDb = invoiceLicence => ({
  billingInvoiceId: invoiceLicence.invoiceId,
  licenceRef: invoiceLicence.licence.licenceNumber,
  licenceId: invoiceLicence.licence.id
});

exports.dbToModel = dbToModel;
exports.modelToDB = modelToDb;
