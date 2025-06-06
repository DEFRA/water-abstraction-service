'use strict'

const Boom = require('@hapi/boom')
const bluebird = require('bluebird')

const mappers = require('../mappers')
const { logger } = require('../../../logger')
const queueManager = require('../../../lib/queue-manager')
const { partialRight } = require('../../../lib/object-helpers.js')

// Constants
const { BatchStatusError } = require('../lib/errors')
const { NotFoundError } = require('../../../lib/errors')
const { BATCH_STATUS, BATCH_TYPE } = require('../../../lib/models/batch')
const { SCHEME } = require('../../../lib/models/constants')
const config = require('../../../../config')

// Services
const newRepos = require('../../../lib/connectors/repos')
const eventService = require('../../../lib/services/events')
const invoiceLicenceService = require('./invoice-licences-service')
const transactionsService = require('./transactions-service')
const billingVolumesService = require('./billing-volumes-service')
const invoiceService = require('../../../lib/services/invoice-service')
const licencesService = require('../../../lib/services/licences')
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs')

// Models
const Event = require('../../../lib/models/event')
const Batch = require('../../../lib/models/batch')

// Jobs
const { jobName: deleteErroredBatchName } = require('../jobs/delete-errored-batch')

/**
 * Loads a Batch instance by ID
 * @param {String} id - batch ID GUID
 * @param {Boolean} includeInvoices
 * @return {Promise<Batch>}
 */
const getBatchById = async (id, includeInvoices = false) => {
  let row
  if (includeInvoices) {
    row = await newRepos.billingBatches.findOneWithInvoices(id)
  } else {
    row = await newRepos.billingBatches.findOne(id)
  }

  if (row) {
    return mappers.batch.dbToModel(row)
  }

  return null
}

const getBatches = async (page = 1, perPage = Number.MAX_SAFE_INTEGER) => {
  const result = await newRepos.billingBatches.findPage(page, perPage)
  return {
    data: result.data.map(mappers.batch.dbToModel),
    pagination: result.pagination
  }
}

const mapBatch = batch => batch ? mappers.batch.dbToModel(batch) : null

const getExistingBatch = (batches, toFinancialYearEnding) => {
  const liveStatuses = [
    BATCH_STATUS.processing,
    BATCH_STATUS.ready,
    BATCH_STATUS.review
  ]

  const existingBatch = batches.find(batch => liveStatuses.includes(batch.status) && batch.toFinancialYearEnding === toFinancialYearEnding)
  return mapBatch(existingBatch)
}

const getDuplicateSentBatch = (batches, batchType, toFinancialYearEnding, isSummer, scheme) => {
  const duplicateSentBatch = batches.find(batch =>
    batch.status === BATCH_STATUS.sent &&
      batch.batchType === batchType &&
      batch.toFinancialYearEnding === toFinancialYearEnding &&
      batch.isSummer === isSummer &&
      batch.scheme === scheme)
  return mapBatch(duplicateSentBatch)
}

const getExistingAndDuplicateBatchesForRegion = async (regionId, batchType, toFinancialYearEnding, isSummer, scheme) => {
  const batches = await newRepos.billingBatches.findByRegionId(regionId)
  return {
    existingBatch: getExistingBatch(batches, toFinancialYearEnding),
    duplicateSentBatch: getDuplicateSentBatch(batches, batchType, toFinancialYearEnding, isSummer, scheme)
  }
}

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
const getExistingOrDuplicateSentBatch = async (regionId, batchType, toFinancialYearEnding, isSummer, scheme) => {
  const { existingBatch, duplicateSentBatch } = await getExistingAndDuplicateBatchesForRegion(regionId, batchType, toFinancialYearEnding, isSummer, scheme)

  // supplementary batches can be run multiple times for the same region, year and season
  if (batchType === BATCH_TYPE.supplementary) return existingBatch

  return duplicateSentBatch || existingBatch
}

const saveEvent = (type, status, user, batch) => {
  const event = new Event().fromHash({
    issuer: user.email,
    type,
    metadata: { user, batch },
    status
  })

  return eventService.create(event)
}

const deleteBatch = async (batch, internalCallingUser) => {
  if (!batch.canBeDeleted()) {
    throw new BatchStatusError(`Batch ${batch.id} cannot be deleted - status is ${batch.status}`)
  }

  try {
    await deleteChargingModuleBillRun(batch.externalId)

    // These are populated at every stage in the bill run
    await newRepos.billingBatchChargeVersionYears.deleteByBatchId(batch.id, false)
    await newRepos.billingVolumes.deleteByBatchId(batch.id)

    // These tables are not yet populated at review stage in TPT
    await newRepos.billingTransactions.deleteByBatchId(batch.id)
    await newRepos.billingInvoiceLicences.deleteByBatchId(batch.id)
    await newRepos.billingInvoices.deleteByBatchId(batch.id, false)
    await newRepos.billingBatches.delete(batch.id)

    await saveEvent('billing-batch:cancel', 'delete', internalCallingUser, batch)
  } catch (err) {
    logger.error('Failed to delete the batch', err, batch)
    await saveEvent('billing-batch:cancel', 'error', internalCallingUser, batch)
    await setStatus(batch.id, BATCH_STATUS.error)
    throw err
  }
}

async function deleteChargingModuleBillRun (billRunId) {
  try {
    await chargeModuleBillRunConnector.delete(billRunId)
  } catch (err) {
    logger.error('Failed to delete Charging Module Bill Run', err, { billRunId })
  }
}

/**
 * Sets the batch status
 * @param {String} batchId
 * @param {BATCH_STATUS} status
 */
const setStatus = (batchId, status) =>
  newRepos.billingBatches.update(batchId, { status })

/**
 * Sets the specified batch to 'error' status
 * Also updates the supplementary statuses for licences in the batch
 *
 * @param {String} batchId
 * @param {BATCH_ERROR_CODE} errorCode The origin of the failure
 * @return {Promise}
 */
const setErrorStatus = async (batchId, errorCode) => {
  logger.error(`Batch ${batchId} failed with error code ${errorCode}`)

  await newRepos.billingVolumes.markVolumesAsErrored(batchId, { require: false })

  // Mark local batch as errored and delete CM batch
  await newRepos.billingBatches.update(batchId, { status: Batch.BATCH_STATUS.error, errorCode })
  if (errorCode !== Batch.BATCH_ERROR_CODE.failedToCreateBillRun) {
    await queueManager.getQueueManager().add(deleteErroredBatchName, batchId)
  }
}

const approveBatch = async (batch, internalCallingUser) => {
  try {
    await chargeModuleBillRunConnector.approve(batch.externalId)
    await chargeModuleBillRunConnector.send(batch.externalId)
    await saveEvent('billing-batch:approve', 'sent', internalCallingUser, batch)
    await invoiceService.resetIsFlaggedForRebilling(batch.id)

    if (batch.type === BATCH_TYPE.supplementary) {
      // if it is a supplementary batch mark all the old transactions in previous batches that was credited back in new
      // invoices sent in this batch for the relevant region.
      await transactionsService.updateIsCredited(batch.region.id)

      if (batch.scheme === 'alcs') {
        await licencesService.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate(
          batch.region.id,
          batch.dateCreated
        )
      } else {
        await licencesService.updateIncludeInSrocSupplementaryBillingStatusForBatch(batch.id)
      }
    }

    return batch
  } catch (err) {
    logger.error('Failed to approve the batch', err.stack, batch)
    // set the status back to ready so the user can retry
    await setStatus(batch.id, BATCH_STATUS.ready)
    await saveEvent('billing-batch:approve', 'error', internalCallingUser, batch)
    throw err
  }
}

const saveInvoiceLicenceTransactions = async invoiceLicence => {
  for (const transaction of invoiceLicence.transactions) {
    const { billingTransactionId } = await transactionsService.saveTransactionToDB(invoiceLicence, transaction)
    transaction.id = billingTransactionId
  }
}

const saveInvoiceLicences = async (batch, invoice) => {
  for (const invoiceLicence of invoice.invoiceLicences) {
    const { id } = await invoiceLicenceService.saveInvoiceLicenceToDB(invoice, invoiceLicence, batch.scheme)
    invoiceLicence.id = id
    await saveInvoiceLicenceTransactions(invoiceLicence)
  }
}

const saveInvoicesToDB = async batch => {
  for (const invoice of batch.invoices) {
    const { billingInvoiceId } = await invoiceService.saveInvoiceToDB(batch, invoice)
    invoice.id = billingInvoiceId
    await saveInvoiceLicences(batch, invoice)
  }
}

/**
 * Gets counts of the number of transactions in each status for the
 * supplied batch ID
 * @param {String} batchId
 */
const getTransactionStatusCounts = async batchId => {
  const data = await newRepos.billingTransactions.findStatusCountsByBatchId(batchId)
  return data.reduce((acc, row) => ({
    ...acc,
    [row.status]: parseInt(row.count)
  }), {})
}

/**
 * Cleans up any
 * - billing_invoice_licences with no related billing_transactions
 * - billing_invoices with no related billing_invoice_licences
 * @param {String} batchId
 * @return {Promise}
 */
const cleanup = async batchId => {
  await newRepos.billingInvoiceLicences.deleteEmptyByBatchId(batchId)
  await newRepos.billingInvoices.deleteEmptyByBatchId(batchId)
}

const getErrMsgForBatchErr = (batch, regionId) => {
  const capitalizeFirstLetter = batch.type.charAt(0).toUpperCase() + batch.type.slice(1)

  return batch.status === BATCH_STATUS.sent
    ? `${capitalizeFirstLetter} batch already sent for: region ${regionId}, financial year ${batch.endYear.yearEnding}, isSummer ${batch.isSummer}`
    : `Batch already live for region ${regionId}`
}

/**
 * Creates batch locally and on CM, responds with Batch service model
 * @param {String} regionId - guid from water.regions.region_id
 * @param {String} batchType - annual|supplementary|two_part_tariff
 * @param {Number} toFinancialYearEnding
 * @param {Boolean} isSummer - Is this a summer season two part tariff run
 * @return {Promise<Batch>} resolves with Batch service model
 */
const create = async (regionId, batchType, toFinancialYearEnding, isSummer) => {
  let fromFinancialYearEnding, scheme
  if (batchType !== 'annual') {
    scheme = 'alcs'
    if (batchType === 'supplementary') {
      fromFinancialYearEnding = config.billing.alcsEndYear - (config.billing.supplementaryYears + (config.billing.alcsEndYear - toFinancialYearEnding))
    } else {
      fromFinancialYearEnding = toFinancialYearEnding
    }
  } else {
    scheme = 'sroc'
    fromFinancialYearEnding = toFinancialYearEnding
  }

  toFinancialYearEnding = scheme === 'alcs' ? _alcsToFinancialYearEnding(toFinancialYearEnding) : toFinancialYearEnding

  const batch = await getExistingOrDuplicateSentBatch(regionId, batchType, toFinancialYearEnding, isSummer, scheme)

  if (batch) {
    const err = Boom.conflict(getErrMsgForBatchErr(batch, regionId))
    err.reformat()
    err.output.payload.batch = batch
    throw err
  }

  const { billingBatchId } = await newRepos.billingBatches.create({
    status: Batch.BATCH_STATUS.queued,
    regionId,
    batchType,
    fromFinancialYearEnding,
    toFinancialYearEnding,
    isSummer,
    scheme
  })

  return getBatchById(billingBatchId)
}

/**
 * Checks when the scheme is ALCS (pre-sroc) that the financial year is not greater than 2022 which is the last year
 * ALCS applies
 *
 * @param {number} selectedFinancialYearEnding The year ending to check
 *
 * @returns {number} the financial year ending to use
 */
function _alcsToFinancialYearEnding (selectedFinancialYearEnding) {
  if (selectedFinancialYearEnding > config.billing.alcsEndYear) {
    return config.billing.alcsEndYear
  }

  return selectedFinancialYearEnding
}

const createChargeModuleBillRun = async batchId => {
  const batch = await getBatchById(batchId)

  // Create CM batch
  const { billRun: cmBillRun } = await chargeModuleBillRunConnector.create(batch.region.code, batch.scheme === SCHEME.alcs ? 'presroc' : batch.scheme)

  // Update DB row
  const row = await newRepos.billingBatches.update(batch.id, {
    externalId: cmBillRun.id,
    billRunNumber: cmBillRun.billRunNumber
  })

  // Return updated batch
  return batch.pickFrom(row, ['externalId', 'billRunNumber'])
}

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
    throw new BatchStatusError('Cannot approve review. Batch status must be "review"')
  }
  await billingVolumesService.approveVolumesForBatch(batch)
  await setStatus(batch.id, BATCH_STATUS.processing)
  return getBatchById(batch.id)
}

const getSentTptBatchesForFinancialYearAndRegion = async (financialYear, region) => {
  const tptBatches = await newRepos.billingBatches.findSentTptBatchesForFinancialYearAndRegion(financialYear.yearEnding, region.id, BATCH_TYPE.twoPartTariff)
  const suppBatches = await newRepos.billingBatches.findSentTptBatchesForFinancialYearAndRegion(financialYear.yearEnding, region.id, BATCH_TYPE.supplementary)
  return [...tptBatches, ...suppBatches].map(mappers.batch.dbToModel)
}

/**
 * deletes all the transactions, invoice licences, invoices, charge version years and charge module data for an invoice
 * @param {object} batch the billig batch object - must contain external id
 * @param {Invoice} invoice water service invoice instance
 */
const deleteInvoicesWithRelatedData = async (batch, invoice) => {
  await newRepos.billingBatchChargeVersionYears.deleteByInvoiceId(invoice.billingInvoiceId)
  await newRepos.billingVolumes.deleteByBatchAndInvoiceId(batch.id, invoice.billingInvoiceId)
  await chargeModuleBillRunConnector.deleteInvoiceFromBillRun(batch.externalId, invoice.externalId)
  await newRepos.billingTransactions.deleteByInvoiceId(invoice.billingInvoiceId)
  await newRepos.billingInvoiceLicences.deleteByInvoiceId(invoice.billingInvoiceId)
  await newRepos.billingInvoices.delete(invoice.billingInvoiceId)
}

/**
 * Deletes an individual invoice from the batch.  Also deletes CM transactions
 * @param {Batch} batch
 * @param {String} invoiceId
 * @param {String} originalBillingInvoiceId
 * @param {String} rebillInvoiceId
 * @return {Promise}
 */
const deleteBatchInvoice = async (batch, invoiceId, originalBillingInvoiceId = null, rebillInvoiceId = null) => {
  // Check batch is in suitable state to delete invoices
  if (!batch.canDeleteInvoices()) {
    throw new BatchStatusError(`Cannot delete invoice from batch when status is ${batch.status}`)
  }
  // Load invoice
  const invoice = await newRepos.billingInvoices.findOne(invoiceId)
  if (!invoice) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`)
  }

  // Set batch status back to 'processing'
  await setStatus(batch.id, Batch.BATCH_STATUS.processing)
  try {
    if (rebillInvoiceId && originalBillingInvoiceId) {
      // find the original Invoice and rebilling invoice (reversal of resissue)
      const originalInvoice = invoice.originalBillingInvoice
      const rebillingInvoice = await newRepos.billingInvoices.findOne(rebillInvoiceId)

      if (!rebillingInvoice) {
        throw new NotFoundError(`Rebilling Invoice ${rebillInvoiceId} not found`)
      } else if (!originalInvoice) {
        throw new NotFoundError(`Original Invoice ${originalBillingInvoiceId} not found`)
      }

      const changes = originalInvoice.originalBillingInvoiceId === originalBillingInvoiceId
        ? {
            isFlaggedForRebilling: false,
            originalBillingInvoiceId: null,
            rebillingState: null
          }
        : { isFlaggedForRebilling: false, rebillingState: 'rebill' }
      // reset the original invoice rebilling status and set isFlaggedForRebilling to false.
      await invoiceService.updateInvoice(originalBillingInvoiceId, changes)
      // delete the rebill and reversal invoices
      await bluebird.mapSeries([rebillingInvoice, invoice], invoiceRow => deleteInvoicesWithRelatedData(batch, invoiceRow))
    } else {
      // delete the normal invoice
      await deleteInvoicesWithRelatedData(batch, invoice)
    }

    return batch
  } catch (err) {
    await setErrorStatus(batch.id, Batch.BATCH_ERROR_CODE.failedToDeleteInvoice)
    throw err
  }
}

/**
 * Deletes all billing data in service (!)
 * @return {Promise}
 */
const deleteAllBillingData = async () => {
  // Delete batches in CM
  const batches = await newRepos.billingBatches.find()
  const batchesWithExternalId = batches.filter(row => !!row.externalId)
  for (const { externalId } of batchesWithExternalId) {
    try {
      logger.info(`Deleting Charge Module batch ${externalId}`)
      await chargeModuleBillRunConnector.delete(externalId)
    } catch (err) {
      logger.error(`Unable to delete Charge Module batch ${externalId}`, err.stack)
    }
  }
  // Delete all data in water.billing_* tables
  return newRepos.billingBatches.deleteAllBillingData()
}

const getBatchTransactionCount = batchId =>
  newRepos.billingTransactions.countByBatchId(batchId)

/**
 * Updates batch from CM summary data
 * @param {String} batchId
 * @param {Object} cmResponse
 * @return {Promise<Batch>} updated batch model
 */
const updateWithCMSummary = async (batchId, cmResponse) => {
  // Extract counts/totals from CM bill run response
  const { invoiceCount, creditNoteCount, invoiceValue, creditNoteValue, netTotal, status: cmStatus, transactionFileReference } = cmResponse.billRun
  // Calculate next batch status
  const cmCompletedStatuses = ['billed', 'billing_not_required']

  const batch = await newRepos.billingBatches.findOne(batchId)
  const status = cmCompletedStatuses.includes(cmStatus) && batch.status !== 'cancel' ? Batch.BATCH_STATUS.sending : Batch.BATCH_STATUS.processing

  // Get transaction count in local DB
  // if 0, the batch will be set to "empty" status
  const count = await getBatchTransactionCount(batchId)

  let changes = {
    status,
    invoiceCount,
    creditNoteCount,
    invoiceValue,
    netTotal,
    transactionFileReference,
    creditNoteValue: -Math.abs(creditNoteValue)
  }
  // if the batch is empty remove the supplementary billing flag from the licences in
  // the region set before the batch creation date and set the batch status to EMPTY
  if (count === 0) {
    changes = { status: BATCH_STATUS.empty }
    await licencesService.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate(batch.region.regionId, batch.dateCreated)
  }

  const data = await newRepos.billingBatches.update(batchId, changes)
  return mappers.batch.dbToModel(data)
}

const generateBatchById = CMBillRunId => chargeModuleBillRunConnector.generate(CMBillRunId)

const requestCMBatchGeneration = async batchId => {
  const batch = await getBatchById(batchId)
  const transactionCount = await getBatchTransactionCount(batch.id)
  if (transactionCount > 0) {
    await chargeModuleBillRunConnector.generate(batch.externalId)
  }
}

exports.approveBatch = approveBatch
exports.deleteBatch = deleteBatch
exports.getBatchById = getBatchById
exports.getBatches = getBatches
exports.getTransactionStatusCounts = getTransactionStatusCounts
exports.getExistingAndDuplicateBatchesForRegion = getExistingAndDuplicateBatchesForRegion
exports.getExistingOrDuplicateSentBatch = getExistingOrDuplicateSentBatch
exports.saveInvoicesToDB = saveInvoicesToDB
exports.setErrorStatus = setErrorStatus
exports.setStatus = setStatus
exports.setStatusToReview = partialRight(setStatus, Batch.BATCH_STATUS.review)
exports.cleanup = cleanup
exports.create = create
exports.createChargeModuleBillRun = createChargeModuleBillRun
exports.approveTptBatchReview = approveTptBatchReview
exports.getSentTptBatchesForFinancialYearAndRegion = getSentTptBatchesForFinancialYearAndRegion
exports.deleteBatchInvoice = deleteBatchInvoice
exports.deleteAllBillingData = deleteAllBillingData
exports.updateWithCMSummary = updateWithCMSummary
exports.generateBatchById = generateBatchById
exports.requestCMBatchGeneration = requestCMBatchGeneration
