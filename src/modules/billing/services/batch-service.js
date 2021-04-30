'use strict';

const { partialRight, startCase } = require('lodash');
const Boom = require('@hapi/boom');

const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const { BATCH_STATUS, BATCH_TYPE } = require('../../../lib/models/batch');
const { logger } = require('../../../logger');
const Event = require('../../../lib/models/event');
const eventService = require('../../../lib/services/events');
const { BatchStatusError } = require('../lib/errors');
const { NotFoundError } = require('../../../lib/errors');
const { INCLUDE_IN_SUPPLEMENTARY_BILLING } = require('../../../lib/models/constants');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

const Batch = require('../../../lib/models/batch');

const invoiceLicenceService = require('./invoice-licences-service');
const transactionsService = require('./transactions-service');
const billingVolumesService = require('./billing-volumes-service');
const invoiceService = require('../../../lib/services/invoice-service');
const licencesService = require('../../../lib/services/licences');
const config = require('../../../../config');

/**
 * Loads a Batch instance by ID
 * @param {String} id - batch ID GUID
 * @return {Promise<Batch>}
 */
const getBatchById = async (id, includeInvoices = false) => {
  const method = includeInvoices
    ? newRepos.billingBatches.findOneWithInvoices
    : newRepos.billingBatches.findOne;
  const row = await method(id);
  return row ? mappers.batch.dbToModel(row) : null;
};

const getBatches = async (page = 1, perPage = Number.MAX_SAFE_INTEGER) => {
  const result = await newRepos.billingBatches.findPage(page, perPage);
  return {
    data: result.data.map(mappers.batch.dbToModel),
    pagination: result.pagination
  };
};

const mapBatch = batch => batch ? mappers.batch.dbToModel(batch) : null;

const getExistingBatch = batches => {
  const liveStatuses = [
    BATCH_STATUS.processing,
    BATCH_STATUS.ready,
    BATCH_STATUS.review
  ];

  const existingBatch = batches.find(b => liveStatuses.includes(b.status));
  return mapBatch(existingBatch);
};

const getDuplicateSentBatch = (batches, batchType, toFinancialYearEnding, isSummer) => {
  const duplicateSentBatch = batches.find(b =>
    b.status === BATCH_STATUS.sent &&
      b.batchType === batchType &&
      b.toFinancialYearEnding === toFinancialYearEnding &&
      b.isSummer === isSummer);
  return mapBatch(duplicateSentBatch);
};

const getExistingAndDuplicateBatchesForRegion = async (regionId, batchType, toFinancialYearEnding, isSummer) => {
  const batches = await newRepos.billingBatches.findByRegionId(regionId);
  return {
    existingBatch: getExistingBatch(batches),
    duplicateSentBatch: getDuplicateSentBatch(batches, batchType, toFinancialYearEnding, isSummer)
  };
};

/**
 * Checks if there is:
 *  - an existing batch in flight for the region
 *  - a given batch for the same type, region, year and season (excluding supplementary)
 * @param {String} regionId
 * @param {String} batchType
 * @param {Number} toFinancialYearEnding
 * @param {Boolean} isSummer
 * @return {Batch|null} if batch exists
 */
const getExistingOrDuplicateSentBatch = async (regionId, batchType, toFinancialYearEnding, isSummer) => {
  const { existingBatch, duplicateSentBatch } = await getExistingAndDuplicateBatchesForRegion(regionId, batchType, toFinancialYearEnding, isSummer);

  // supplementary batches can be run multiple times for the same region, year and season
  if (batchType === BATCH_TYPE.supplementary) return existingBatch;

  return duplicateSentBatch || existingBatch;
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
  if (!batch.canBeDeleted()) {
    throw new BatchStatusError(`Batch ${batch.id} cannot be deleted - status is ${batch.status}`);
  }

  try {
    await licencesService.updateIncludeInSupplementaryBillingStatusForUnsentBatch(batch.id);
    await chargeModuleBillRunConnector.delete(batch.externalId);

    // These are populated at every stage in the bill run
    await newRepos.billingBatchChargeVersionYears.deleteByBatchId(batch.id);
    await newRepos.billingVolumes.deleteByBatchId(batch.id);

    // These tables are not yet populated at review stage in TPT
    await newRepos.billingTransactions.deleteByBatchId(batch.id);
    await newRepos.billingInvoiceLicences.deleteByBatchId(batch.id);
    await newRepos.billingInvoices.deleteByBatchId(batch.id, false);

    await newRepos.billingBatches.delete(batch.id);

    await saveEvent('billing-batch:cancel', 'delete', internalCallingUser, batch);
  } catch (err) {
    logger.error('Failed to delete the batch', err, batch);
    await saveEvent('billing-batch:cancel', 'error', internalCallingUser, batch);
    await setStatus(batch.id, BATCH_STATUS.error);
    throw err;
  }
};

/**
 * Sets the batch status
 * @param {String} batchId
 * @param {BATCH_STATUS} status
 */
const setStatus = (batchId, status) =>
  newRepos.billingBatches.update(batchId, { status });

/**
 * Sets the specified batch to 'error' status
 * Also updates the supplementary statuses for licences in the batch
 *
 * @param {String} batchId
 * @param {BATCH_ERROR_CODE} errorCode The origin of the failure
 * @return {Promise}
 */
const setErrorStatus = async (batchId, errorCode) => {
  logger.error(`Batch ${batchId} failed with error code ${errorCode}`);
  return Promise.all([
    newRepos.billingVolumes.markVolumesAsErrored(batchId, { require: false }),
    newRepos.billingBatches.update(batchId, { status: Batch.BATCH_STATUS.error, errorCode }),
    licencesService.updateIncludeInSupplementaryBillingStatusForUnsentBatch(batchId)
  ]);
};

const approveBatch = async (batch, internalCallingUser) => {
  try {
    await chargeModuleBillRunConnector.approve(batch.externalId);
    await chargeModuleBillRunConnector.send(batch.externalId);

    await saveEvent('billing-batch:approve', 'sent', internalCallingUser, batch);

    await licencesService.updateIncludeInSupplementaryBillingStatusForSentBatch(batch.id);
    await invoiceService.resetIsFlaggedForRebilling(batch.id);

    return setStatus(batch.id, BATCH_STATUS.processing);
  } catch (err) {
    logger.error('Failed to approve the batch', err, batch);
    await saveEvent('billing-batch:approve', 'error', internalCallingUser, batch);
    throw err;
  }
};

const saveInvoiceLicenceTransactions = async (batch, invoice, invoiceLicence) => {
  for (const transaction of invoiceLicence.transactions) {
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
  const count = await newRepos.billingTransactions.countByBatchId(batch.id);
  return count === 0 ? setStatus(batch.id, BATCH_STATUS.empty) : batch;
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

const getErrMsgForBatchErr = (batch, regionId) =>
  batch.status === BATCH_STATUS.sent
    ? `${startCase(batch.type)} batch already sent for: region ${regionId}, financial year ${batch.endYear.yearEnding}, isSummer ${batch.isSummer}`
    : `Batch already live for region ${regionId}`;

/**
 * Creates batch locally and on CM, responds with Batch service model
 * @param {String} regionId - guid from water.regions.region_id
 * @param {String} batchType - annual|supplementary|two_part_tariff
 * @param {Number} toFinancialYearEnding
 * @param {Boolean} isSummer - Is this a summer season two part tariff run
 * @return {Promise<Batch>} resolves with Batch service model
 */
const create = async (regionId, batchType, toFinancialYearEnding, isSummer) => {
  const batch = await getExistingOrDuplicateSentBatch(regionId, batchType, toFinancialYearEnding, isSummer);

  if (batch) {
    const err = Boom.conflict(getErrMsgForBatchErr(batch, regionId));
    err.reformat();
    err.output.payload.batch = batch;
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
  if (!batch.canApproveReview()) {
    throw new BatchStatusError('Cannot approve review. Batch status must be "review"');
  }
  await billingVolumesService.approveVolumesForBatch(batch);
  await setStatus(batch.id, BATCH_STATUS.processing);
  return getBatchById(batch.id);
};

const getSentTptBatchesForFinancialYearAndRegion = async (financialYear, region) => {
  const result = await newRepos.billingBatches.findSentTptBatchesForFinancialYearAndRegion(financialYear.yearEnding, region.id);
  return result.map(mappers.batch.dbToModel);
};

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

  // Set batch status back to 'processing'
  await setStatus(batch.id, Batch.BATCH_STATUS.processing);

  // Load invoice
  const invoice = await newRepos.billingInvoices.findOne(invoiceId);
  if (!invoice) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }

  try {
    await chargeModuleBillRunConnector.deleteInvoiceFromBillRun(invoice.billingBatch.externalId, invoice.externalId);
    // Delete local data
    await newRepos.billingBatchChargeVersionYears.deleteByInvoiceId(invoiceId);
    await newRepos.billingVolumes.deleteByBatchAndInvoiceId(batch.id, invoiceId);
    await newRepos.billingTransactions.deleteByInvoiceId(invoiceId);
    await newRepos.billingInvoiceLicences.deleteByInvoiceId(invoiceId);
    await newRepos.billingInvoices.delete(invoiceId);

    // update the include in supplementary billing status
    const invoiceModel = mappers.invoice.dbToModel(invoice);
    await updateInvoiceLicencesForSupplementaryReprocessing(invoiceModel);

    // Mark batch as 'empty' if needed
    return setStatusToEmptyWhenNoTransactions(batch);
  } catch (err) {
    await setErrorStatus(batch.id, Batch.BATCH_ERROR_CODE.failedToDeleteInvoice);
    throw err;
  }
};

/**
 * Deletes all billing data in service (!)
 * @return {Promise}
 */
const deleteAllBillingData = async () => {
  // Delete batches in CM
  const batches = await newRepos.billingBatches.find();
  const batchesWithExternalId = batches.filter(row => !!row.externalId);
  for (const { externalId } of batchesWithExternalId) {
    try {
      logger.info(`Deleting Charge Module batch ${externalId}`);
      await chargeModuleBillRunConnector.delete(externalId);
    } catch (err) {
      logger.error(`Unable to delete Charge Module batch ${externalId}`, err);
    }
  }
  // Delete all data in water.billing_* tables
  return newRepos.billingBatches.deleteAllBillingData();
};

/**
 * Updates batch from CM summary data
 * @param {String} batchId
 * @param {Object} cmResponse
 * @return {Promise<Batch>} updated batch model
 */
const updateWithCMSummary = async (batchId, cmResponse) => {
  const { invoiceCount, creditLineCount: creditNoteCount, invoiceValue, creditLineValue: creditNoteValue, netTotal, status: cmStatus } = cmResponse.billRun;

  const cmCompletedStatuses = ['pending', 'billed', 'billing_not_required'];

  const status = cmCompletedStatuses.includes(cmStatus)
    ? Batch.BATCH_STATUS.sent
    : Batch.BATCH_STATUS.ready;

  const changes = {
    status,
    invoiceCount,
    creditNoteCount,
    invoiceValue,
    creditNoteValue,
    netTotal
  };

  const data = await newRepos.billingBatches.update(batchId, changes);
  return mappers.batch.dbToModel(data);
};

const generateBatchById = CMBillRunId => chargeModuleBillRunConnector.generate(CMBillRunId);

exports.approveBatch = approveBatch;
exports.deleteBatch = deleteBatch;
exports.getBatchById = getBatchById;
exports.getBatches = getBatches;
exports.getTransactionStatusCounts = getTransactionStatusCounts;
exports.getExistingAndDuplicateBatchesForRegion = getExistingAndDuplicateBatchesForRegion;
exports.getExistingOrDuplicateSentBatch = getExistingOrDuplicateSentBatch;
exports.saveInvoicesToDB = saveInvoicesToDB;
exports.setErrorStatus = setErrorStatus;
exports.setStatus = setStatus;
exports.setStatusToReview = partialRight(setStatus, Batch.BATCH_STATUS.review);
exports.setStatusToEmptyWhenNoTransactions = setStatusToEmptyWhenNoTransactions;
exports.cleanup = cleanup;
exports.create = create;
exports.createChargeModuleBillRun = createChargeModuleBillRun;
exports.approveTptBatchReview = approveTptBatchReview;
exports.getSentTptBatchesForFinancialYearAndRegion = getSentTptBatchesForFinancialYearAndRegion;
exports.deleteBatchInvoice = deleteBatchInvoice;
exports.deleteAllBillingData = deleteAllBillingData;
exports.updateWithCMSummary = updateWithCMSummary;
exports.generateBatchById = generateBatchById;
