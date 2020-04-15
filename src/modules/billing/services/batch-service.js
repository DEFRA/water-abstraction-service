'use strict';

const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const repos = require('../../../lib/connectors/repository');
const { BATCH_STATUS } = require('../../../lib/models/batch');
const { logger } = require('../../../logger');
const Event = require('../../../lib/models/event');
const eventService = require('../../../lib/services/events');

const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

const Batch = require('../../../lib/models/batch');

const invoiceLicenceService = require('./invoice-licences-service');
const transactionsService = require('./transactions-service');
const invoiceService = require('./invoice-service');
const invoiceAccountsService = require('./invoice-accounts-service');
const config = require('../../../../config');

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
  try {
    await chargeModuleBillRunConnector.delete(batch.externalId);

    await repos.billingBatchChargeVersionYears.deleteByBatchId(batch.id);
    await repos.billingBatchChargeVersions.deleteByBatchId(batch.id);
    await repos.billingTransactions.deleteByBatchId(batch.id);
    await repos.billingInvoiceLicences.deleteByBatchId(batch.id);
    await repos.billingInvoices.deleteByBatchId(batch.id);
    await newRepos.billingBatches.delete(batch.id);

    await saveEvent('billing-batch:cancel', 'delete', internalCallingUser, batch);
  } catch (err) {
    logger.error('Failed to delete the batch', err, batch);
    await saveEvent('billing-batch:cancel', 'error', internalCallingUser, batch);
    await setStatus(batch.id, BATCH_STATUS.error);
    throw err;
  }
};

const setStatus = (batchId, status) =>
  newRepos.billingBatches.update(batchId, { status });

const approveBatch = async (batch, internalCallingUser) => {
  try {
    await chargeModuleBillRunConnector.approve(batch.externalId);
    await chargeModuleBillRunConnector.send(batch.externalId);

    await saveEvent('billing-batch:approve', 'sent', internalCallingUser, batch);

    // @TODO for supplementary billing, reset water.licence.include_in_supplementary_billing
    // flags

    return setStatus(batch.id, BATCH_STATUS.sent);
  } catch (err) {
    logger.error('Failed to approve the batch', err, batch);
    await saveEvent('billing-batch:approve', 'error', internalCallingUser, batch);
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
    const { billRun: { summary } } = await chargeModuleBillRunConnector.get(batch.externalId);
    batch.totals = mappers.totals.chargeModuleBillRunToBatchModel(summary);
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
  const { billRun: { summary } } = await chargeModuleBillRunConnector.get(batch.externalId);
  return newRepos.billingBatches.update(batch.id, {
    invoiceCount: summary.invoiceCount,
    creditNoteCount: summary.creditNoteCount,
    netTotal: summary.netTotal
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
    [row.status]: parseInt(row.count)
  }), {});
};

const deleteAccountFromBatch = async (batch, accountId) => {
  // get the invoice account from the CRM to access
  // the customer reference number.
  const invoiceAccount = await invoiceAccountsService.getByInvoiceAccountId(accountId);

  // Delete from CM
  await chargeModuleBillRunConnector.removeCustomer(batch.externalId, invoiceAccount.accountNumber);

  // Delete from local DB
  await repos.billingTransactions.deleteByInvoiceAccount(batch.id, accountId);
  await newRepos.billingInvoiceLicences.deleteByBatchAndInvoiceAccount(batch.id, accountId);
  await newRepos.billingInvoices.deleteByBatchAndInvoiceAccountId(batch.id, accountId);

  // @TODO delete charge versions no longer affected
  return setStatusToEmptyWhenNoTransactions(batch);
};

/**
 * If the batch has no more transactions then the batch is set
 * to empty, otherwise it stays the same
 *
 * @param {Batch} batch
 * @returns {Batch} The updated batch if no transactions
 */
const setStatusToEmptyWhenNoTransactions = async batch => {
  const remainingTransactions = await newRepos.billingTransactions.findByBatchId(batch.id);

  if (remainingTransactions.length === 0) {
    return setStatus(batch.id, BATCH_STATUS.empty);
  }
  return batch;
};

/**
 * Cleans up any
 * - billing_invoice_licences with no related billing_transactions
 * - billing_invoices with no related billing_invoice_licences
 * @param {String} batchId
 * @return {Promise}
 */
const cleanup = async batchId => {
  await newRepos.billingInvoiceLicences.deleteEmptyByBatchId(batchId);
  await newRepos.billingInvoices.deleteEmptyByBatchId(batchId);
};

/**
 * Creates batch locally and on CM, responds with Batch service model
 * @param {String} regionId - guid from water.regions.region_id
 * @param {String} batchType - annual|supplementary|two_part_tariff
 * @param {Number} toFinancialYearEnding
 * @param {Boolean} isSummer - Is this a summer season two part tariff run
 * @return {Promise<Batch>} resolves with Batch service model
 */
const create = async (regionId, batchType, toFinancialYearEnding, isSummer) => {
  const existingBatch = await getMostRecentLiveBatchByRegion(regionId);

  if (existingBatch) {
    const err = new Error(`Batch already live for region ${regionId}`);
    err.existingBatch = existingBatch;
    throw err;
  }

  const fromFinancialYearEnding = batchType === 'supplementary'
    ? toFinancialYearEnding - config.billing.supplementaryYears
    : toFinancialYearEnding;

  const { billingBatchId } = await newRepos.billingBatches.create({
    status: Batch.BATCH_STATUS.processing,
    regionId,
    batchType,
    fromFinancialYearEnding,
    toFinancialYearEnding,
    isSummer
  });

  return getBatchById(billingBatchId);
};

const createChargeModuleBillRun = async batchId => {
  const batch = await getBatchById(batchId);

  // Create CM batch
  const { billRun: cmBillRun } = await chargeModuleBillRunConnector.create(batch.region.code);

  // Update DB row
  const row = await newRepos.billingBatches.update(batch.id, {
    externalId: cmBillRun.id,
    billRunId: cmBillRun.billRunId
  });

  // Return updated batch
  return batch.pickFrom(row, ['externalId', 'billRunId']);
};

exports.approveBatch = approveBatch;
exports.decorateBatchWithTotals = decorateBatchWithTotals;
exports.deleteAccountFromBatch = deleteAccountFromBatch;
exports.deleteBatch = deleteBatch;

exports.getBatchById = getBatchById;
exports.getBatches = getBatches;
exports.getMostRecentLiveBatchByRegion = getMostRecentLiveBatchByRegion;
exports.getTransactionStatusCounts = getTransactionStatusCounts;

exports.refreshTotals = refreshTotals;
exports.saveInvoicesToDB = saveInvoicesToDB;
exports.setErrorStatus = setErrorStatus;
exports.setStatus = setStatus;
exports.setStatusToEmptyWhenNoTransactions = setStatusToEmptyWhenNoTransactions;
exports.cleanup = cleanup;
exports.create = create;
exports.createChargeModuleBillRun = createChargeModuleBillRun;
