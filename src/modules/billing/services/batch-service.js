'use strict';

const { flatMap } = require('lodash');

const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const { BATCH_STATUS } = require('../../../lib/models/batch');
const { logger } = require('../../../logger');
const Event = require('../../../lib/models/event');
const eventService = require('../../../lib/services/events');
const { BatchStatusError, BillingVolumeStatusError } = require('../lib/errors');
const { NotFoundError } = require('../../../lib/errors');
const { INCLUDE_IN_SUPPLEMENTARY_BILLING } = require('../../../lib/models/constants');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

const Batch = require('../../../lib/models/batch');
const validators = require('../../../lib/models/validators');

const invoiceLicenceService = require('./invoice-licences-service');
const transactionsService = require('./transactions-service');
const billingVolumesService = require('./billing-volumes-service');
const invoiceService = require('./invoice-service');
const licencesService = require('../../../lib/services/licences');
const config = require('../../../../config');

const chargeModuleDecorators = require('../decorators/charge-module-decorators');

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
    await licencesService.updateIncludeInSupplementaryBillingStatusForUnsentBatch(batch.id);
    await chargeModuleBillRunConnector.delete(batch.externalId);

    await newRepos.billingBatchChargeVersionYears.deleteByBatchId(batch.id);
    await newRepos.billingBatchChargeVersions.deleteByBatchId(batch.id);
    await newRepos.billingTransactions.deleteByBatchId(batch.id);
    await newRepos.billingVolumes.deleteByBatchId(batch.id);
    await newRepos.billingInvoiceLicences.deleteByBatchId(batch.id);
    await newRepos.billingInvoices.deleteByBatchId(batch.id);
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

    await licencesService.updateIncludeInSupplementaryBillingStatusForSentBatch(batch.id);

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

/**
 * Decorates the supplied batch with data retrieved from the charge module
 * @param {Batch} batch
 * @return {Promise<Batch>}
 */
const decorateBatchWithTotals = async batch => {
  try {
    const cmResponse = await chargeModuleBillRunConnector.get(batch.externalId);
    return chargeModuleDecorators.decorateBatch(cmResponse);
  } catch (err) {
    logger.info('Failed to decorate batch with totals. Waiting for CM API', err);
  }
  return batch;
};

/**
 * Persists the batch totals to water.billing_batches
 * @param {Batch} batch
 * @return {Promise}
 */
const persistTotals = batch => {
  const changes = batch.totals.pick([
    'invoiceCount',
    'creditNoteCount',
    'netTotal'
  ]);
  return newRepos.billingBatches.update(batch.id, changes);
};

/**
 * Updates water.billing_batches with summary info from the charge module
 * and updates the is_deminimis flag for water.billing_transactions
 * @param {Batch} batch
 * @return {Promise}
 */
const refreshTotals = async batchId => {
  validators.assertId(batchId);

  // Load batch and map to service models
  const data = await newRepos.billingBatches.findOneWithInvoicesWithTransactions(batchId);
  const batch = mappers.batch.dbToModel(data);

  // Load CM data and decorate service models
  const cmResponse = await chargeModuleBillRunConnector.get(batch.externalId);
  chargeModuleDecorators.decorateBatch(batch, cmResponse);

  return Promise.all([
    transactionsService.persistDeMinimis(batch),
    persistTotals(batch)
  ]);
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
    billRunNumber: cmBillRun.billRunNumber
  });

  // Return updated batch
  return batch.pickFrom(row, ['externalId', 'billRunNumber']);
};

const assertNoBillingVolumesWithTwoPartError = async batch => {
  const billingVolumesWithTwoPartError = await billingVolumesService.getVolumesWithTwoPartError(batch);
  if (billingVolumesWithTwoPartError.length > 0) {
    throw new BillingVolumeStatusError('Cannot approve review. There are outstanding two part tariff errors to resolve');
  }
};

const assertBatchStatusIsReview = batch => {
  if (batch.status !== BATCH_STATUS.review) {
    throw new BatchStatusError('Cannot approve review. Batch status must be "review"');
  }
};

/**
 * Validates batch & transactions, then updates batch status to "processing"
 *
 * Validation:
 *  - batch is in "review" status
 *  - all twoPartTariff errors in billingVolumes have been resolved
 * throws relevant error if validation fails
 *
 * @param {Batch} batch to be approved
 * @return {Promise<Batch>} resolves with Batch service model
 */
const approveTptBatchReview = async batch => {
  await assertNoBillingVolumesWithTwoPartError(batch);
  assertBatchStatusIsReview(batch);
  await setStatus(batch.id, BATCH_STATUS.processing);
  return getBatchById(batch.id);
};

const getSentTPTBatchesForFinancialYearAndRegion = async (financialYear, region) =>
  newRepos.billingBatches.findSentTPTBatchesForFinancialYearAndRegion(financialYear.yearEnding, region.id);

/**
   * Updates each licence in the invoice so that the includeInSupplementaryBilling
   * value is 'reprocess' where it is current 'yes'
   *
   * @param {Object<Invoice>} invoice The invoice containing the licences to update
   */
const updateInvoiceLicencesForSupplementaryReprocessing = invoice => {
  return licencesService.updateIncludeInSupplementaryBillingStatus(
    INCLUDE_IN_SUPPLEMENTARY_BILLING.yes,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.reprocess,
    ...invoice.getLicenceIds()
  );
};

/**
 * Deletes an individual invoice from the batch.  Also deletes CM transactions
 * @param {Batch} batch
 * @param {String} invoiceId
 * @return {Promise}
 */
const deleteBatchInvoice = async (batch, invoiceId) => {
  // Check batch is in suitable state to delete invoices
  if (!batch.canDeleteInvoices()) {
    throw new BatchStatusError(`Cannot delete invoice from batch when status is ${batch.status}`);
  }

  // Load invoice
  const invoice = await newRepos.billingInvoices.findOne(invoiceId);
  if (!invoice) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }

  try {
    // Delete CM transactions
    const { invoiceAccountNumber, financialYearEnding } = invoice;
    const { externalId } = invoice.billingBatch;
    await chargeModuleBillRunConnector.removeCustomerInFinancialYear(externalId, invoiceAccountNumber, financialYearEnding);

    // Delete local data
    await newRepos.billingBatchChargeVersionYears.deleteByInvoiceId(invoiceId);
    await newRepos.billingVolumes.deleteByBatchAndInvoiceId(batch.id, invoiceId);
    await newRepos.billingTransactions.deleteByInvoiceId(invoiceId);
    await newRepos.billingInvoiceLicences.deleteByInvoiceId(invoiceId);
    await newRepos.billingInvoices.delete(invoiceId);

    // update the include in supplementary billing status
    const invoiceModel = mappers.invoice.dbToModel(invoice);
    await updateInvoiceLicencesForSupplementaryReprocessing(invoiceModel);

    return setStatusToEmptyWhenNoTransactions(batch);
  } catch (err) {
    await setErrorStatus(batch.id, Batch.BATCH_ERROR_CODE.failedToDeleteInvoice);
    throw err;
  }
};

exports.approveBatch = approveBatch;
exports.decorateBatchWithTotals = decorateBatchWithTotals;
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
exports.approveTptBatchReview = approveTptBatchReview;
exports.getSentTPTBatchesForFinancialYearAndRegion = getSentTPTBatchesForFinancialYearAndRegion;
exports.deleteBatchInvoice = deleteBatchInvoice;
