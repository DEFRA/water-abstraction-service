'use strict'

const batchService = require('../services/batch-service')
const chargeVersionYearsService = require('../services/charge-version-year')
const licencesService = require('../services/licences-service')
const billingVolumesService = require('../services/billing-volumes-service')
const { BATCH_STATUS } = require('../../../lib/models/batch')
const mapErrorResponse = require('../../../lib/map-error-response')
const { jobStatus } = require('../lib/event')
const batchStatus = require('../jobs/lib/batch-status')
const { createBatchEvent, EVENT_TYPES } = require('../lib/batch-event')
const bluebird = require('bluebird')
const { jobName: processChargeVersionsJobName } = require('../jobs/process-charge-versions')
const invoiceAccountService = require('../../../lib/services/invoice-accounts-service')
/**
 * Gets a list of licences in the batch for two-part tariff review
 * GET /water/1.0/billing/batches/{batchId}/two-part-tariff-licences
 */
const getBatchLicences = async (request, h) => {
  const { batch } = request.pre

  if (batch.statusIsOneOf(BATCH_STATUS.review)) {
    return licencesService.getByBatchIdForTwoPartTariffReview(batch.id)
  }

  if (batch.statusIsOneOf(BATCH_STATUS.empty)) {
    return []
  }

  return h.response('Cannot get licences for processing or errored batch').code(403)
}

/**
 * Gets a list of BillingVolume instances relating to the supplied
 * billing batch and licence
 * GET /water/1.0/billing/batches/{batchId}/licences/{licenceId}/billing-volumes
 * @param {String} request.params.batchId
 * @param {String} request.params.licenceId
 */
const getBatchLicenceVolumes = async (request) => {
  const { batch } = request.pre

  const billingVolumes = await billingVolumesService.getLicenceBillingVolumes(batch, request.params.licenceId)
  return bluebird.mapSeries(billingVolumes, async billingVolume => {
    const chargeDetails = await billingVolumesService.getBillingVolumeChargePeriod(billingVolume)
    billingVolume.chargePeriod = chargeDetails.chargePeriod
    billingVolume.invoiceAccount = await invoiceAccountService.getByInvoiceAccountId(chargeDetails.invoiceAccountId)
    return billingVolume
  })
}

/**
 * Delete a licence from the two-part tariff bill run
 * DELETE /water/1.0/billing/batches/{batchId}/licences/{licenceId}
 * @param {String} request.params.batchId
 * @param {String} request.params.licenceId
 */
const deleteBatchLicence = async (request, h) => {
  const { batch } = request.pre

  try {
    await licencesService.deleteBatchLicence(batch, request.params.licenceId)
    return h.response().code(204)
  } catch (err) {
    return mapErrorResponse(err)
  }
}

/**
 * Get a single billing volume by ID
 * GET /water/1.0/billing/volumes/{billingVolumeId} - view billing volume by billing volume ID
 * @param {String} request.params.billingVolumeId
 */
const getBillingVolume = async request => {
  try {
    const { billingVolumeId } = request.params

    const billingVolume = await billingVolumesService.getBillingVolumeById(billingVolumeId)

    // Get charge period
    billingVolume.chargePeriod = await billingVolumesService.getBillingVolumeChargePeriod(billingVolume)

    // Include the charge period in the payload response
    return billingVolume
  } catch (err) {
    return mapErrorResponse(err)
  }
}

/**
 * Deletes billing volumes given a batchId, licenceId, and fin year.
 * DELETE /water/1.0/billing/batches/{batchId}/licences/{licenceId}/financial-year-ending/{financialYearEnding}
 * @param {String} request.params.batchId
 * @param {String} request.params.licenceId
 * @param {Number} request.params.financialYearEnding
 */
const deleteBatchLicenceBillingVolumes = async (request, h) => {
  try {
    const { batchId, licenceId, financialYearEnding } = request.params
    const batch = await batchService.getBatchById(batchId)

    batchStatus.assertBatchIsInReview(batch)

    await billingVolumesService.deleteBillingVolumeByFinancialYearEnding(batchId, licenceId, financialYearEnding)
    await chargeVersionYearsService.deleteChargeVersionYear(batchId, licenceId, financialYearEnding)

    return h.response().code(204)
  } catch (err) {
    return mapErrorResponse(err)
  }
}

/**
 * Updates a billing volume by ID
 * PATCH /water/1.0/billing-volumes/{billingVolumeId} - update billing volume
 * @param {String} request.params.billingVolumeId
 * @param {Number} request.payload.volume
 * @param {Object} request.defra.internalCallingUser - user updating the volume
 */
const patchBillingVolume = async (request, h) => {
  try {
    const { billingVolumeId } = request.params
    const { volume } = request.payload
    const { internalCallingUser: user } = request.defra

    const data = await billingVolumesService.updateBillingVolume(billingVolumeId, volume, user)
    return data
  } catch (err) {
    return mapErrorResponse(err)
  }
}

/**
 * Approve two-part tariff review
 * POST /water/1.0/billing/batches/{batchId}/approve
 * @param {String} request.params.batchId - batch ID
 * @param {Object} request.defra.internalCallingUser - user approving the batch
 */
const postApproveReviewBatch = async (request, h) => {
  const { batch } = request.pre
  const { email: issuer } = request.auth.credentials

  try {
    const updatedBatch = await batchService.approveTptBatchReview(batch)

    const batchEvent = await createBatchEvent({
      issuer,
      type: EVENT_TYPES.approveReview,
      status: jobStatus.processing,
      batch: updatedBatch
    })

    // Kick off next stage of processing
    await request.queueManager.add(processChargeVersionsJobName, batch.id)

    const responseData = {
      event: batchEvent,
      batch: updatedBatch,
      url: `/water/1.0/event/${batchEvent.id}`
    }

    return { data: responseData, error: null }
  } catch (err) {
    return mapErrorResponse(err)
  }
}

exports.getBatchLicences = getBatchLicences
exports.getBatchLicenceVolumes = getBatchLicenceVolumes
exports.deleteBatchLicence = deleteBatchLicence
exports.getBillingVolume = getBillingVolume
exports.deleteBatchLicenceBillingVolumes = deleteBatchLicenceBillingVolumes
exports.patchBillingVolume = patchBillingVolume
exports.postApproveReviewBatch = postApproveReviewBatch
