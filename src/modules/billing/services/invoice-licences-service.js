'use strict';

const newRepos = require('../../../lib/connectors/repos');

const mappers = require('../mappers');

/**
 * Saves an Invoice model to water.billing_invoices
 * @param {Invoice} invoice
 * @param {InvoiceLicence} invoiceLicence
 * @return {Promise<Object>} row data inserted
 */
const saveInvoiceLicenceToDB = async (invoice, invoiceLicence) => {
  const data = mappers.invoiceLicence.modelToDB(invoice, invoiceLicence);
  const dbRow = await newRepos.billingInvoiceLicences.upsert(data);
  return mappers.invoiceLicence.dbToModel(dbRow);
};

const getInvoiceLicenceWithTransactions = async invoiceLicenceId => {
  // Get InvoiceLicence with transactions from repo
  const data = await newRepos.billingInvoiceLicences.findOneInvoiceLicenceWithTransactions(invoiceLicenceId);
  // Map data to InvoiceLicence model
  const invoiceLicence = mappers.invoiceLicence.dbToModel(data);
  return invoiceLicence;
};

const getOrCreateInvoiceLicence = async (billingInvoiceId, licenceId, licenceRef) => {
  const data = await newRepos.billingInvoiceLicences.upsert({
    billingInvoiceId,
    licenceId,
    licenceRef
  });
  return mappers.invoiceLicence.dbToModel(data);
};

exports.saveInvoiceLicenceToDB = saveInvoiceLicenceToDB;
exports.getInvoiceLicenceWithTransactions = getInvoiceLicenceWithTransactions;
exports.getOrCreateInvoiceLicence = getOrCreateInvoiceLicence;
