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

/**
   * Gets a shape of data not defined by the service layer models that
   * represents the billing invoice licence records that exist in a
   * batch, including the aggregated two part tariff status codes for the
   * underlying transactions.
   *
   * This shifts from the pattern of passing models around due to
   * the volume of data that would have to be serialized for annual batches.
   *
   * @param {String} batchId
   */
const getLicencesWithTransactionStatusesForBatch = async batchId => {
  const data = await newRepos.billingInvoiceLicences.findLicencesWithTransactionStatusesForBatch(batchId);

  return data.map(item => {
    return {
      billingInvoiceId: item.billingInvoiceId,
      billingInvoiceLicenceId: item.billingInvoiceLicenceId,
      licenceRef: item.licenceRef,
      licenceId: item.licenceId,
      licenceHolder: item.licenceHolderName,
      twoPartTariffStatuses: Array.from(
        item.twoPartTariffStatuses.reduce((statuses, status) => {
          return (status === null) ? statuses : statuses.add(status);
        }, new Set())
      )
    };
  });
};

exports.getLicencesWithTransactionStatusesForBatch = getLicencesWithTransactionStatusesForBatch;
exports.saveInvoiceLicenceToDB = saveInvoiceLicenceToDB;
