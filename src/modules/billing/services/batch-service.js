'use strict';

const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const repos = require('../../../lib/connectors/repository');
const { BATCH_STATUS } = require('../../../lib/models/batch');
const { logger } = require('../../../logger');
const event = require('../../../lib/event');

const chargeModuleBatchConnector = require('../../../lib/connectors/charge-module/batches');
const Batch = require('../../../lib/models/batch');

const invoiceLicenceService = require('./invoice-licences-service');
const transactionsService = require('./transactions-service');
const invoiceService = require('./invoice-service');

/**
 * Loads a Batch instance by ID
 * @param {String} id - batch ID GUID
 * @return {Promise<Batch>}
 */
const getBatchById = async id => {
  const row = await newRepos.billingBatches.findOne(id);
  return row ? mappers.batch.dbToModel(row) : null;
};

const getBatches = async (page = 1, perPage = Number.MAX_SAFE_INTEGER) => {
  const result = await newRepos.billingBatches.findPage(page, perPage);
  return {
    data: result.data.map(mappers.batch.dbToModel),
    pagination: result.pagination
  };
};

const saveEvent = (type, status, user, batch) => {
  return event.save(event.create({
    issuer: user.email,
    type,
    metadata: { user, batch },
    status
  }));
};

const deleteBatch = async (batch, internalCallingUser) => {
  const { batchId } = batch;

  try {
    await chargeModuleBatchConnector.delete(batch.region.code, batchId);

    await repos.billingBatchChargeVersionYears.deleteByBatchId(batchId);
    await repos.billingBatchChargeVersions.deleteByBatchId(batchId);
    await repos.billingTransactions.deleteByBatchId(batchId);
    await repos.billingInvoiceLicences.deleteByBatchId(batchId);
    await repos.billingInvoices.deleteByBatchId(batchId);
    await newRepos.billingBatches.delete(batchId);

    await saveEvent('billing-batch:cancel', 'delete', internalCallingUser, batch);
  } catch (err) {
    logger.error('Failed to delete the batch', err, batch);
    await saveEvent('billing-batch:cancel', 'error', internalCallingUser, batch);
    await setStatus(batchId, BATCH_STATUS.error);
    throw err;
  }
};

const setStatus = (batchId, status) =>
  newRepos.billingBatches.update(batchId, { status });

const approveBatch = async (batch, internalCallingUser) => {
  const { batchId } = batch;
  try {
    await chargeModuleBatchConnector.approve(batch.region.code, batchId);
    await chargeModuleBatchConnector.send(batch.region.code, batchId, false);

    await saveEvent('billing-batch:approve', 'sent', internalCallingUser, batch);

    return setStatus(batchId, BATCH_STATUS.sent);
  } catch (err) {
    logger.error('Failed to approve the batch', err, batch);
    await saveEvent('billing-batch:approve', 'error', internalCallingUser, batch);
    await setStatus(batchId, BATCH_STATUS.error);
    throw err;
  }
};

/**
 * Sets the specified batch to 'error' status
 * @param {String} batchId
 * @return {Promise}
 */
const setErrorStatus = batchId =>
  newRepos.billingBatches.update(batchId, { status: Batch.BATCH_STATUS.error });

const saveInvoiceLicenceTransactions = async (batch, invoice, invoiceLicence) => {
  for (const transaction of invoiceLicence.transactions) {
    transaction.createTransactionKey(invoice.invoiceAccount, invoiceLicence.licence, batch);
    const { billingTransactionId } = await transactionsService.saveTransactionToDB(invoiceLicence, transaction);
    transaction.id = billingTransactionId;
  }
};

const saveInvoiceLicences = async (batch, invoice) => {
  for (const invoiceLicence of invoice.invoiceLicences) {
    const { billingInvoiceLicenceId } = await invoiceLicenceService.saveInvoiceLicenceToDB(invoice, invoiceLicence);
    invoiceLicence.id = billingInvoiceLicenceId;
    await saveInvoiceLicenceTransactions(batch, invoice, invoiceLicence);
  }
};

const saveInvoicesToDB = async batch => {
  for (const invoice of batch.invoices) {
    const { billingInvoiceId } = await invoiceService.saveInvoiceToDB(batch, invoice);
    invoice.id = billingInvoiceId;
    await saveInvoiceLicences(batch, invoice);
  }
};

const decorateBatchWithTotals = async batch => {
  const chargeModuleSummary = await chargeModuleBatchConnector.send(batch.region.code, batch.id, true);
  batch.totals = mappers.totals.chargeModuleBillRunToBatchModel(chargeModuleSummary.summary);
  return batch;
};

exports.approveBatch = approveBatch;
exports.deleteBatch = deleteBatch;
exports.getBatchById = getBatchById;
exports.getBatches = getBatches;
exports.saveInvoicesToDB = saveInvoicesToDB;
exports.setErrorStatus = setErrorStatus;
exports.setStatus = setStatus;
exports.decorateBatchWithTotals = decorateBatchWithTotals;
