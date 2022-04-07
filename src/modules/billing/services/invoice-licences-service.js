'use strict';

const newRepos = require('../../../lib/connectors/repos');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

// Job handling
const messageQueue = require('../../../lib/message-queue-v2');
const refreshTotalsJob = require('../jobs/refresh-totals');

const mappers = require('../mappers');
const Batch = require('../../../lib/models/batch');
const errors = require('../../../lib/errors');
const { logger } = require('../../../logger');

// Services
const licencesService = require('../../../lib/services/licences');
const batchService = require('./batch-service');

/**
 * Saves an Invoice model to water.billing_invoices
 * @param {Invoice} invoice
 * @param {InvoiceLicence} invoiceLicence
 * @return {Promise<Object>} row data inserted
 */
const saveInvoiceLicenceToDB = async (invoice, invoiceLicence, scheme) => {
  if (scheme === 'alcs') {
    const data = mappers.invoiceLicence.modelToDB(invoice, invoiceLicence);
    const dbRow = await newRepos.billingInvoiceLicences.upsert(data);
    return mappers.invoiceLicence.dbToModel(dbRow);
  } else {
    const dbRow = await newRepos.billingInvoiceLicences.upsert(invoice);
    return dbRow;
  }
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

/**
 * Deletes the invoice licence by ID
 * @param {String} invoiceLicenceId
 * @returns {Promise}
 */
const deleteByInvoiceLicenceId = async invoiceLicenceId => {
  // Get billing invoice licence and validate
  const billingInvoiceLicence = await newRepos.billingInvoiceLicences.findOne(invoiceLicenceId);
  await validateInvoiceLicenceIsDeletable(billingInvoiceLicence);

  // Validation complete
  const { billingBatchId: batchId } = billingInvoiceLicence.billingInvoice.billingBatch;

  try {
    // Set batch to "processing" status while processing takes place
    await batchService.setStatus(batchId, Batch.BATCH_STATUS.processing);

    // Delete local/CM data for this licence
    await deleteCMInvoiceLicence(billingInvoiceLicence);
    await deleteWRLSInvoiceLicence(invoiceLicenceId);

    // Flag for supplementary billing
    await licencesService.flagForSupplementaryBilling(billingInvoiceLicence.licenceId);

    // Publish refresh totals job
    return messageQueue.getQueueManager().add(refreshTotalsJob.jobName, batchId);
  } catch (err) {
    logger.error(`Failed to delete invoice licence ${invoiceLicenceId} in batch ${batchId}`, err);
    // Set batch to "error" status
    await batchService.setStatus(batchId, Batch.BATCH_STATUS.error);
    throw err;
  }
};

const validateInvoiceLicenceIsDeletable = async billingInvoiceLicence => {
  assertInvoiceLicenceExists(billingInvoiceLicence);
  assertRelatedBatchHasReadyStatus(billingInvoiceLicence);
  assertInvoiceIsNotARebill(billingInvoiceLicence);

  // Validate invoice licence count within parent invoice
  const invoiceLicenceCountInInvoice = await getInvoiceLicenceCount(billingInvoiceLicence);
  assertMultipleLicencesInInvoice(invoiceLicenceCountInInvoice);
};

const assertInvoiceLicenceExists = billingInvoiceLicence => {
  if (!billingInvoiceLicence) {
    throw new errors.NotFoundError('Invoice licence not found');
  }
};

const assertRelatedBatchHasReadyStatus = billingInvoiceLicence => {
  const { status } = billingInvoiceLicence.billingInvoice.billingBatch;
  if (status !== Batch.BATCH_STATUS.ready) {
    throw new errors.ConflictingDataError(`Expected batch in ready status (status is "${status}")`);
  }
};

const assertInvoiceIsNotARebill = billingInvoiceLicence => {
  if (billingInvoiceLicence.billingInvoice.rebillingState !== null) {
    throw new errors.ConflictingDataError('Cannot delete a licence for a rebilling invoice');
  }
};

const getInvoiceLicenceCount = billingInvoiceLicence =>
  newRepos.billingInvoiceLicences.findCountByInvoiceId(
    billingInvoiceLicence.billingInvoice.billingInvoiceId
  );

const assertMultipleLicencesInInvoice = invoiceLicenceCountInInvoice => {
  if (invoiceLicenceCountInInvoice < 2) {
    throw new errors.ConflictingDataError(`Expected 2 or more invoice licences in invoice (${invoiceLicenceCountInInvoice} found)`);
  }
};

const deleteWRLSInvoiceLicence = async invoiceLicenceId => {
  await newRepos.billingTransactions.deleteByInvoiceLicenceId(invoiceLicenceId);
  await newRepos.billingInvoiceLicences.delete(invoiceLicenceId);
};

const deleteCMInvoiceLicence = async billingInvoiceLicence => {
  const { externalId: cmBatchId } = billingInvoiceLicence.billingInvoice.billingBatch;
  const { externalId: cmInvoiceId } = billingInvoiceLicence.billingInvoice;
  const { licenceRef } = billingInvoiceLicence;

  // Fetch invoice and find CM licence ID
  const { invoice } = await chargeModuleBillRunConnector.getInvoiceTransactions(cmBatchId, cmInvoiceId);
  const { id: cmLicenceId } = invoice.licences.find(row => row.licenceNumber === licenceRef);

  // Delete licence in CM
  return chargeModuleBillRunConnector.deleteLicence(cmBatchId, cmLicenceId);
};

exports.saveInvoiceLicenceToDB = saveInvoiceLicenceToDB;
exports.getInvoiceLicenceWithTransactions = getInvoiceLicenceWithTransactions;
exports.getOrCreateInvoiceLicence = getOrCreateInvoiceLicence;
exports.deleteByInvoiceLicenceId = deleteByInvoiceLicenceId;
