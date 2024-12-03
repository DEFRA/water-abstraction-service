'use strict'

const repos = require('../../../lib/connectors/repos')
const Batch = require('../../../lib/models/batch')
const { BatchStatusError } = require('../lib/errors')
const licencesService = require('../../../lib/services/licences')
const invoiceAccountService = require('../../../lib/services/invoice-accounts-service')
const system = require('../../../lib/connectors/system/licence-supplementary-billing.js')

const mapItem = (licence, invoiceAccount) => ({
  licenceId: licence.licenceId,
  licenceRef: licence.licenceRef,
  twoPartTariffError: licence.twoPartTariffErrors.includes(true),
  twoPartTariffStatuses: Array.from(
    licence.twoPartTariffStatuses.reduce((statuses, status) => (status === null) ? statuses : statuses.add(status), new Set())
  ),
  billingContact: invoiceAccount.company.name,
  billingVolumeEdited: licence.returnVolumeEdited > 0
})

/**
 * Gets a shape of data not defined by the service layer models that
 * represents the billing invoice licence records that exist in a
 * batch, including the aggregated two part tariff status codes for the
 * underlying transactions.
 * This shifts from the pattern of passing models around due to
 * the volume of data that would have to be serialized for annual batches.
 * Invoice Account Company added to display the billing contact in the UI
 *
 * @param {String} batchId
 * @return {Promise<Array>}
 */
const getByBatchIdForTwoPartTariffReview = async batchId => {
  const data = await repos.licences.findByBatchIdForTwoPartTariffReview(batchId)
  // Create a new set to remove duplicate values
  const uniqueIds = [...new Set(data.map(row => row.invoiceAccountId))]
  const invoiceAccounts = await invoiceAccountService.getByInvoiceAccountIds(uniqueIds)
  return data.map(licence => {
    const invoiceAccount = invoiceAccounts.find(invAcc => invAcc.id === licence.invoiceAccountId)
    return mapItem(licence, invoiceAccount)
  })
}

/**
 * Deletes the 2PT transactions types from the batch during TPT review stage
 * First part charges will still be included in the batch
 * @param {Batch} batch
 * @param {String} licenceId
 */
const deleteBatchLicence = async (batch, licenceId) => {
  // Check batch is in review status
  if (!batch.statusIsOneOf(Batch.BATCH_STATUS.review)) {
    throw new BatchStatusError('Cannot delete licence unless batch is in "review" status')
  }
  await repos.billingVolumes.deleteByBatchIdAndLicenceId(batch.id, licenceId)
  // only the 2PT part will be deleted from the bill run
  await repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceId(batch.id, licenceId, true)

  // flag for supplementary billing
  // This route is only used by pre-sroc two-part tariff bills meaning the only flag that would be put on any licence
  // coming through here would only be pre-sroc ('alcs')
  await system.licenceFlagSupplementaryBilling(licenceId, 'alcs')
}

const updateIncludeInSupplementaryBillingStatusForEmptyBatch = async batchId => {
  const batch = await repos.billingBatches.findOne(batchId)
  return licencesService.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate(batch.region.regionId, batch.dateCreated)
}

exports.getByBatchIdForTwoPartTariffReview = getByBatchIdForTwoPartTariffReview
exports.deleteBatchLicence = deleteBatchLicence
exports.updateIncludeInSupplementaryBillingStatusForEmptyBatch = updateIncludeInSupplementaryBillingStatusForEmptyBatch
