'use strict'

const { BillingVolume, bookshelf } = require('../bookshelf')
const queries = require('./queries/billing-volumes')
const raw = require('./lib/raw')

/**
 * Create a new billing volume
 * @param {Object} data - camel case
 */
const create = async data => {
  const model = await BillingVolume
    .forge(data)
    .save()
  return model.toJSON()
}

/**
 * Gets billing volumes for charge elements and financial year
 * @param {Array<String>} ids - guids
 * @param {Number} financialYear
 * @param {String} batchId findApprovedByChargeElementIdsFinancialYearAndBatchId
 */
const findApprovedByChargeElementIdsFinancialYearAndBatchId = async (ids, financialYear, batchId) => {
  const result = await BillingVolume
    .forge()
    .query('whereIn', 'charge_element_id', ids)
    .where({
      financial_year: financialYear,
      is_approved: true,
      errored_on: null,
      billing_batch_id: batchId
    })
    .fetchAll()

  return result.toJSON()
}

/**
 * Updates the record with the fields contained within changes object
 * @param {String} billingVolumeId
 * @param {Object} changes
 */
const update = async (billingVolumeId, changes) => {
  const result = await BillingVolume.forge({ billingVolumeId }).save(changes)
  return result.toJSON()
}

/**
 * Gets billing volumes for a given batchId where the isApproved flag = flase
 * @param {String} batchId
 */
const getUnapprovedVolumesForBatch = async batchId => {
  const result = await BillingVolume
    .forge()
    .where({ billing_batch_id: batchId, is_approved: false, errored_on: null })
    .fetchAll()

  return result.toJSON()
}

const findByBatchId = async batchId => {
  const result = await BillingVolume
    .forge()
    .where({
      billing_batch_id: batchId
    })
    .fetchAll()
  return result.toJSON()
}

/**
 * Deletes all billing volumes for given batch
 * @param {String} batchId - guid
 */
const deleteByBatchId = async batchId => BillingVolume
  .forge()
  .where({ billing_batch_id: batchId })
  .destroy({ require: false })

/**
* Deletes all billing volumes related to invoice licence
* @param {String} invoiceLicenceId - guid
* @param {String} batchId - guid
*/
// @TODO: Check if this works as expected when functionality to delete invoices by financial year
const deleteByInvoiceLicenceAndBatchId = async (invoiceLicenceId, batchId) =>
  bookshelf.knex.raw(queries.deleteByInvoiceLicenceAndBatchId, { invoiceLicenceId, batchId })

/**
* Deletes all billing volumes for given invoice account and batch
* @param {String} batchId - guid
* @param {String} invoiceAccountId - guid
*/
const deleteByBatchAndInvoiceId = async (batchId, billingInvoiceId) =>
  bookshelf.knex.raw(queries.deleteByBatchAndInvoiceId, { batchId, billingInvoiceId })

/**
 * Finds billing volumes relating to the supplied billing batch ID and licence ID
 * @param {String} billingBatchId
 * @param {String} licenceId
 */
const findByBatchIdAndLicenceId = (billingBatchId, licenceId) =>
  raw.multiRow(queries.findByBatchIdAndLicenceId, { billingBatchId, licenceId })

/**
 * Finds billing volumes by supplied IDs
 * @param {Array<String>} billingVolumeIds
 * @return {Promise<Array>}
 */
const findByIds = async billingVolumeIds => {
  const result = await BillingVolume
    .where('billing_volume_id', 'in', billingVolumeIds)
    .fetchAll({
      withRelated: [
        'chargeElement',
        'chargeElement.purposeUse'
      ]
    })
  return result.toJSON()
}

/**
 * Deletes billing volumes in a batch for a particular licence ID
 * @param {String} billingBatchId
 * @param {String} licenceId
 */
const deleteByBatchIdAndLicenceId = (billingBatchId, licenceId) =>
  bookshelf.knex.raw(queries.deleteByBatchIdAndLicenceId, { billingBatchId, licenceId })

/**
 * Updates all records by batch ID
 * @param {String} billingBatchId
 * @param {Object} changes
 */
const updateByBatchId = async (billingBatchId, changes) => {
  const result = await BillingVolume
    .where('billing_batch_id', billingBatchId)
    .save(changes, { method: 'update', require: false })
  return result.toJSON()
}

/**
 * Marks all records as errored by batch ID
 * @param {String} billingBatchId
 */
const markVolumesAsErrored = async (billingBatchId, options = {}) => {
  const result = await BillingVolume
    .where('billing_batch_id', billingBatchId)
    .save({
      errored_on: new Date()
    }, { method: 'update', ...options })
  return result.toJSON()
}

/**
 * Finds approved billing volumes for the specified charge version ID
 * in the supplied financial year and season
 *
 * @param {String} chargeVersionId - guid
 * @param {Number} financialYearEnding - e.g. 2020
 * @param {Boolean} isSummer
 * @return {Promise<Array>}
 */
const findByChargeVersionFinancialYearAndSeason = async (chargeVersionId, financialYearEnding, isSummer) =>
  raw.multiRow(queries.findByChargeVersionFinancialYearAndSeason, {
    chargeVersionId, financialYearEnding, isSummer
  })

/**
 * Finds billing volumes for the specified charge version ID
 * in the supplied financial year.  Includes the batch source
 *
 * @param {String} billingBatchId
 * @param {String} licenceId
 */
const findByChargeVersionAndFinancialYear = (chargeVersionId, financialYearEnding) =>
  raw.multiRow(queries.findByChargeVersionAndFinancialYear, { chargeVersionId, financialYearEnding })

/**
 * Finds billing volumes for the specified charge version ID
 * in the supplied financial year.  Includes the batch source
 *
 * @param {String} billingBatchId
 * @param {String} licenceId
 */
const deleteByFinancialYearEnding = (batchId, licenceId, financialYearEnding) =>
  raw.multiRow(queries.deleteByFinancialYearEnding, {
    batchId, licenceId, financialYearEnding
  })

exports.create = create
exports.findApprovedByChargeElementIdsFinancialYearAndBatchId = findApprovedByChargeElementIdsFinancialYearAndBatchId
exports.update = update
exports.getUnapprovedVolumesForBatch = getUnapprovedVolumesForBatch
exports.findByBatchId = findByBatchId
exports.deleteByBatchId = deleteByBatchId
exports.deleteByInvoiceLicenceAndBatchId = deleteByInvoiceLicenceAndBatchId
exports.deleteByBatchAndInvoiceId = deleteByBatchAndInvoiceId
exports.findByBatchIdAndLicenceId = findByBatchIdAndLicenceId
exports.findByIds = findByIds
exports.deleteByBatchIdAndLicenceId = deleteByBatchIdAndLicenceId
exports.updateByBatchId = updateByBatchId
exports.markVolumesAsErrored = markVolumesAsErrored
exports.findByChargeVersionFinancialYearAndSeason = findByChargeVersionFinancialYearAndSeason
exports.findByChargeVersionAndFinancialYear = findByChargeVersionAndFinancialYear
exports.deleteByFinancialYearEnding = deleteByFinancialYearEnding
