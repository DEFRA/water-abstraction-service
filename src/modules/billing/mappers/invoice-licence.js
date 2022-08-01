'use strict'

const InvoiceLicence = require('../../../lib/models/invoice-licence')

// Mappers
const transaction = require('./transaction')
const licence = require('../../../lib/mappers/licence')

/**
 * Maps a row of data from water.billing_invoice_licences
 * to an InvoiceLicence model
 * @param {Object} row - camel cased
 * @return {InvoiceLicence}
 */
const dbToModel = row => {
  const invoiceLicence = new InvoiceLicence(row.billingInvoiceLicenceId)
  if (row.billingTransactions) {
    invoiceLicence.transactions = row.billingTransactions.map(transaction.dbToModel)
  }
  if (row.licence) {
    invoiceLicence.licence = licence.dbToModel(row.licence)
  }
  invoiceLicence.invoiceId = row.billingInvoiceId
  return invoiceLicence
}

/**
 * Maps data from an InvoiceLicence model to the correct shape for water.billing_invoice_licences
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToDb = (invoice, invoiceLicence) => {
  // Map data to new row in water.billing_invoice_licences

  return {
    billingInvoiceId: invoice.id,
    licenceRef: invoiceLicence.licence.licenceNumber,
    licenceId: invoiceLicence.licence.id
  }
}

exports.dbToModel = dbToModel
exports.modelToDB = modelToDb
