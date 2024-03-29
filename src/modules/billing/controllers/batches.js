'use strict'

const Boom = require('@hapi/boom')

const { jobStatus } = require('../lib/event')
const { createBatchEvent } = require('../lib/batch-event')
const controller = require('../../../lib/controller')
const mapErrorResponse = require('../../../lib/map-error-response')
const mappers = require('../mappers')
const { logger } = require('../../../logger')

// Services
const invoiceService = require('../../../lib/services/invoice-service')
const invoiceLicenceService = require('../services/invoice-licences-service')
const chargeVersionService = require('../../../lib/services/charge-versions')
const batchService = require('../services/batch-service')
const importConnector = require('../../../lib/connectors/import')

// Bull job queue manager
const { jobName: createBillRunJobName } = require('../jobs/create-bill-run')
const { jobName: refreshTotalsJobName } = require('../jobs/refresh-totals')
const { jobName: approveBatchJobName } = require('../jobs/approve-batch')
const batchStatus = require('../jobs/lib/batch-status')
const { BATCH_STATUS } = require('../../../lib/models/batch')
const { BillingBatch } = require('../../../lib/connectors/bookshelf')

const YEARS_TO_GO_BACK_FOR_UNSENT_BATCHES = 3

/**
 * Resource that will create a new batch skeleton which will
 * then be asynchronously populated with charge versions by a
 * job that is added to the queue.
 *
 * @param {Object} request HAPI request object
 * @param {Object} h HAPI response toolkit
 */
const postCreateBatch = async (request, h) => {
  const { userEmail, regionId, batchType, financialYearEnding, isSummer } = request.payload

  try {
    // create a new entry in the batch table
    const batch = await batchService.create(regionId, batchType, financialYearEnding, isSummer)
    // add these details to the event log
    const batchEvent = await createBatchEvent({
      batch,
      issuer: userEmail,
      subtype: batch.type,
      status: jobStatus.start
    })

    // add a new job to the queue so that the batch can be created in the CM
    await request.queueManager.add(createBillRunJobName, batch.id)

    const responseData = {
      batch,
      event: batchEvent,
      url: `/water/1.0/event/${batchEvent.id}`
    }

    return h.response({ data: responseData, error: null }).code(202)
  } catch (err) {
    if (err.existingBatch) {
      return h.response({
        message: err.message,
        existingBatch: err.existingBatch
      }).code(409)
    }
    throw err
  }
}

/**
 * Get batch with region, and optionally include batch totals
 * @param {Boolean} request.query.totals - indicates that batch totals should be included in response
 * @return {Promise<Batch>}
 */
const getBatch = async request => request.pre.batch

const getBatches = async request => {
  const { page, perPage } = request.query
  return batchService.getBatches(page, perPage)
}

const getBatchInvoices = async request => {
  const { batch } = request.pre
  try {
    const invoices = await invoiceService.getInvoicesForBatch(batch, {
      includeInvoiceAccounts: true
    })
    const mappedInvoices = invoices.map(mappers.api.invoice.modelToBatchInvoices)

    return mappedInvoices
  } catch (err) {
    return mapErrorResponse(err)
  }
}

const getBatchInvoicesDetails = async request => {
  const { batch } = request.pre
  const data = await invoiceService.getInvoicesTransactionsForBatch(batch)
  return data || Boom.notFound(`No invoices found in batch with id: ${batch.id}`)
}

const getBatchInvoiceDetail = async request => {
  const { invoiceId } = request.params
  const { batch } = request.pre
  const invoice = await invoiceService.getInvoiceForBatch(batch, invoiceId)
  return invoice || Boom.notFound(`No invoice found with id: ${invoiceId} in batch with id: ${batch.id}`)
}

/**
 * Delete an invoice by ID from the batch
 * @param {Object} request
 * @param {Batch} request.pre.batch
 * @param {String} request.params.invoiceId
 */
const deleteBatchInvoice = async (request, h) => {
  const { batch } = request.pre
  const { invoiceId } = request.params
  const { originalInvoiceId, rebillInvoiceId } = request.query

  try {
    await batchService.deleteBatchInvoice(batch, invoiceId, originalInvoiceId, rebillInvoiceId) /* delete both related bills */

    // Refresh batch net total / counts
    await request.queueManager.add(refreshTotalsJobName, batch.id)

    return h.response().code(204)
  } catch (err) {
    return mapErrorResponse(err)
  }
}

const deleteBatch = (request, h) => controller.deleteEntity(
  batchService.deleteBatch,
  h,
  request.pre.batch,
  request.defra.internalCallingUser
)

const postRefreshBatch = async (request, h) => {
  const { batchId } = request.params

  try {
    await request.queueManager.add(refreshTotalsJobName, batchId)

    return h.response().code(204)
  } catch (err) {
    return err
  }
}

const postApproveBatch = async request => {
  const { batch } = request.pre
  const { internalCallingUser } = request.defra
  try {
    await request.queueManager.add(approveBatchJobName, batch.id, internalCallingUser)
    // set the batch status to processing
    return batchService.setStatus(batch.id, BATCH_STATUS.sending)
  } catch (err) {
    return err
  }
}

const getInvoiceLicenceWithTransactions = async request => {
  const { invoiceLicenceId } = request.params
  const invoiceLicence = await invoiceLicenceService.getInvoiceLicenceWithTransactions(invoiceLicenceId)
  return invoiceLicence || Boom.notFound(`Invoice licence ${invoiceLicenceId} not found`)
}

const getBatchDownloadData = async request => {
  const { batch } = request.pre
  const invoices = await invoiceService.getInvoicesForBatchDownload(batch)

  // Create a new set to remove duplicate values
  // Define an array of unique charge version IDS
  const chargeVersionIds = [...new Set(
    // Map over the invoice array and return an array of charge version IDs
    invoices.flatMap(invoice => {
      // Get an array of billing invoice licences and filter out transactions
      const filtered = invoice.billingInvoiceLicences.flatMap(invoiceLicence =>
        invoiceLicence.billingTransactions
          .filter(transaction => !!transaction.chargeElement)
          .flatMap(transaction => transaction.chargeElement.chargeVersionId)
      )
      // Return a flattened array of charge version IDs
      return filtered
    })
  )]

  const chargeVersions = await chargeVersionService.getManyByChargeVersionIds(chargeVersionIds)
  return { invoices, chargeVersions }
}

/**
 * Deletes all billing data (!)
 * - Deletes water.billing_* tables
 * - Deletes water.charge_versions/water.charge_elements
 * - Re-imports charge version data from import module
 * @return {Promise}
 */
const deleteAllBillingData = async (request, h) => {
  try {
    await batchService.deleteAllBillingData()
    await importConnector.postImportChargeVersions()
    return h.response().code(204)
  } catch (err) {
    logger.error('Error deleting all billing data', err.stack)
    return mapErrorResponse(err)
  }
}

const postSetBatchStatusToCancel = async (request, h) => {
  const { batch } = request.pre
  try {
    batchStatus.assertBatchIsProcessing(batch)

    // delete all jobs for the batch
    await request.queueManager.deleteKeysByPattern(`*${batch.id}*`)
    // set the batch status to cancel
    await batchService.setStatus(batch.id, BATCH_STATUS.cancel)
    return h.response().code(204)
  } catch (err) {
    return err
  }
}

const postBatchBillableYears = async (request, h) => {
  const { regionId, isSummer, currentFinancialYear } = request.payload

  const existingBatches = await BillingBatch
    .where({
      region_id: regionId,
      batch_type: 'two_part_tariff',
      is_summer: isSummer
    })
    .where('status', 'in', [
      BATCH_STATUS.sent,
      BATCH_STATUS.processing,
      BATCH_STATUS.ready,
      BATCH_STATUS.review
    ])
    .fetchAll({ columns: ['to_financial_year_ending'] })

  const batchFinancialYears = await existingBatches.toJSON().map(batch => batch.toFinancialYearEnding)
  const unsentYears = _determineUnsentYears(currentFinancialYear, batchFinancialYears)

  return h.response({ unsentYears }).code(200)
}

function _determineUnsentYears (currentFinancialYear, batchFinancialYears) {
  const unsentYears = []

  for (let index = 0; index < YEARS_TO_GO_BACK_FOR_UNSENT_BATCHES; index++) {
    const yearToTest = currentFinancialYear - index
    if (!batchFinancialYears.includes(yearToTest)) {
      unsentYears.push(yearToTest)
    }
  }

  return unsentYears
}

module.exports = {
  getBatch,
  getBatches,
  getBatchDownloadData,
  getBatchInvoices,
  getBatchInvoiceDetail,
  getBatchInvoicesDetails,
  getInvoiceLicenceWithTransactions,
  deleteBatchInvoice,
  deleteBatch,
  postApproveBatch,
  postCreateBatch,
  postRefreshBatch,
  deleteAllBillingData,
  postSetBatchStatusToCancel,
  postBatchBillableYears
}
