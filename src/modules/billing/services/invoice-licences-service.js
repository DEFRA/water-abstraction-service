'use strict';

const newRepos = require('../../../lib/connectors/repos');

const mappers = require('../mappers');

/**
 * Saves an Invoice model to water.billing_invoices
 * @param {Invoice} invoice
 * @param {InvoiceLicence} invoiceLicence
 * @return {Promise<Object>} row data inserted
 */
const saveInvoiceLicenceToDB = (invoice, invoiceLicence) => {
  const data = mappers.invoiceLicence.modelToDB(invoice, invoiceLicence);
  return newRepos.billingInvoiceLicences.upsert(data);
};

exports.saveInvoiceLicenceToDB = saveInvoiceLicenceToDB;
