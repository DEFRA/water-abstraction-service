'use strict';

const { camelCase } = require('lodash');

const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const repos = require('../../../lib/connectors/repository');
const { BATCH_STATUS } = require('../../../lib/models/batch');
const { logger } = require('../../../logger');
const Event = require('../../../lib/models/event');
const eventService = require('../../../lib/services/events');

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

const getMostRecentLiveBatchByRegion = async regionId => {
  const batches = await newRepos.billingBatches.findByStatuses([
    BATCH_STATUS.processing,
    BATCH_STATUS.ready,
    BATCH_STATUS.review
  ]);
  const batch = batches.find(b => b.regionId === regionId);

  return batch ? mappers.batch.dbToModel(batch) : null;
};

const saveEvent = (type, status, user, batch) => {
  const event = new Event().fromHash({
    issuer: user.email,
    type,
    metadata: { user, batch },
    status
  });

  return eventService.create(event);
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
  try {
    await chargeModuleBatchConnector.approve(batch.region.code, batch.id);
    await chargeModuleBatchConnector.send(batch.region.code, batch.id, false);

    await saveEvent('billing-batch:approve', 'sent', internalCallingUser, batch);

    return setStatus(batch.id, BATCH_STATUS.sent);
  } catch (err) {
    logger.error('Failed to approve the batch', err, batch);
    await saveEvent('billing-batch:approve', 'error', internalCallingUser, batch);
    await setStatus(batch.id, BATCH_STATUS.error);
    throw err;
  }
};

/**
 * Sets the specified batch to 'error' status
 *
 * @param {String} batchId
 * @param {BATCH_ERROR_CODE} errorCode The origin of the failure
 * @return {Promise}
 */
const setErrorStatus = (batchId, errorCode) => {
  return newRepos.billingBatches.update(batchId, {
    status: Batch.BATCH_STATUS.error,
    errorCode
  });
};

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
  try {
    const chargeModuleSummary = await chargeModuleBatchConnector.send(batch.region.code, batch.id, true);
    batch.totals = mappers.totals.chargeModuleBillRunToBatchModel(chargeModuleSummary.summary);
  } catch (err) {
    logger.info('Failed to decorate batch with totals. Waiting for CM API', err);
  }
  return batch;
};

/**
 * Updates water.billing_batches with summary info from the charge module
 * @param {Batch} batch
 * @return {Promise}
 */
const refreshTotals = async batch => {
  const { billRunId, summary } = await chargeModuleBatchConnector.send(batch.region.code, batch.id, true);
  return newRepos.billingBatches.update(batch.id, {
    invoiceCount: summary.invoiceCount,
    creditNoteCount: summary.creditNoteCount,
    netTotal: summary.netTotal,
    externalId: billRunId
  });
};

/**
 * Gets counts of the number of transactions in each status for the
 * supplied batch ID
 * @param {String} batchId
 */
const getTransactionStatusCounts = async batchId => {
  const data = await newRepos.billingTransactions.findStatusCountsByBatchId(batchId);
  return data.reduce((acc, row) => ({
    ...acc,
    [camelCase(row.status)]: row.count
  }), {});
};

exports.approveBatch = approveBatch;
exports.deleteBatch = deleteBatch;
exports.getBatches = getBatches;
exports.getBatchById = getBatchById;
exports.getMostRecentLiveBatchByRegion = getMostRecentLiveBatchByRegion;
exports.saveInvoicesToDB = saveInvoicesToDB;
exports.setErrorStatus = setErrorStatus;
exports.setStatus = setStatus;
exports.decorateBatchWithTotals = decorateBatchWithTotals;
exports.refreshTotals = refreshTotals;
exports.getTransactionStatusCounts = getTransactionStatusCounts;
