'use strict';

const newRepos = require('../../../lib/connectors/repos');

const mappers = require('../mappers');
const { NotFoundError } = require('../../../lib/errors');
const { BatchStatusError } = require('../lib/errors');
const Batch = require('../../../lib/models/batch');
const batchService = require('./batch-service');

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

const getInvoiceLicenceWithTransactions = async invoiceLicenceId => {
  // Get InvoiceLicence with transactions from repo
  const data = await newRepos.billingInvoiceLicences.findOneInvoiceLicenceWithTransactions(invoiceLicenceId);
  // Map data to InvoiceLicence model
  const invoiceLicence = mappers.invoiceLicence.dbToModel(data);
  return invoiceLicence;
};

/**
 * Deletes an InvoiceLicence by ID
 * The batch must be in 'review' status to be deleted
 * @param {String} invoiceLicenceId
 * @return {Promise}
 */
const deleteInvoiceLicence = async invoiceLicenceId => {
  // Load data from DB
  const invoiceLicence = await newRepos.billingInvoiceLicences.findOne(invoiceLicenceId);
  if (!invoiceLicence) {
    throw new NotFoundError(`Invoice licence ${invoiceLicenceId} not found`);
  }

  // Create batch service model from retrieved data
  const batch = mappers.batch.dbToModel(invoiceLicence.billingInvoice.billingBatch);
  if (!batch.statusIsOneOf(Batch.BATCH_STATUS.review)) {
    throw new BatchStatusError(`Batch ${batch.id} status '${Batch.BATCH_STATUS.review}' expected`);
  }

  // Delete billing volumes for invoice licence
  await newRepos.billingVolumes.deleteByInvoiceLicenceAndBatchId(invoiceLicenceId, batch.id);

  // Delete transactions for invoice licence
  await newRepos.billingTransactions.deleteByInvoiceLicenceId(invoiceLicenceId);

  // Delete invoice licence
  await newRepos.billingInvoiceLicences.delete(invoiceLicenceId);

  // Set batch to empty if required
  return batchService.setStatusToEmptyWhenNoTransactions(batch);
};

exports.saveInvoiceLicenceToDB = saveInvoiceLicenceToDB;
exports.getInvoiceLicenceWithTransactions = getInvoiceLicenceWithTransactions;
exports.delete = deleteInvoiceLicence;
