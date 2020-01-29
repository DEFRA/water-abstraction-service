'use strict';

const repos = require('../../../lib/connectors/repository');
const mappers = require('../mappers');

const licenceService = require('./licence-service');

/**
 * Saves an Invoice model to water.billing_invoices
 * @param {Invoice} invoice
 * @param {InvoiceLicence} invoiceLicence
 * @return {Promise<Object>} row data inserted
 */
const saveInvoiceLicenceToDB = async (invoice, invoiceLicence) => {
  const data = mappers.invoiceLicence.modelToDB(invoice, invoiceLicence);
  const { rows: [row] } = await repos.billingInvoiceLicences.create(data);
  return row;
};

/**
 * Retrieves an invoice licence row from water.billing_invoices relating to the
 * given transaction ID, and returns an Invoice model
 * @param {String} transactionId - GUID
 * @return {Promise<Invoice>}
 */
const getByTransactionId = async transactionId => {
  const data = await repos.billingInvoiceLicences.findOneByTransactionId(transactionId);
  const invoiceLicence = mappers.invoiceLicence.dbToModel(data);
  invoiceLicence.licence = await licenceService.getByLicenceNumber(data.licence_ref);
  return invoiceLicence;
};

exports.saveInvoiceLicenceToDB = saveInvoiceLicenceToDB;
exports.getByTransactionId = getByTransactionId;
