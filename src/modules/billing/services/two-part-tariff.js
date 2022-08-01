'use strict'

const bluebird = require('bluebird')

const Batch = require('../../../lib/models/batch')
const FinancialYear = require('../../../lib/models/financial-year')

const validators = require('../../../lib/models/validators')

const chargeVersionYearService = require('./charge-version-year')
const billingVolumesService = require('./billing-volumes-service')
const volumeMatchingService = require('./volume-matching-service')

/**
 * Decorates each BillingVolume in the supplied array with the
 * supplied billingBatchId property if it doesn't already have one
 * @param {Array<BillingVolume>} billingVolumes
 * @param {String} billingBatchId
 */
const decorateBillingVolumesWithBatchId = (billingVolumes, billingBatchId) =>
  billingVolumes.forEach(billingVolume => {
    billingVolume.billingBatchId = billingBatchId
    return billingVolume
  })

/**
 * Processes the supplied charge version year and season flag and persists
 * the billing volumes to the DB via the billing volumes service
 * @param {Object} chargeVersionYear
 * @param {String} chargeVersionYear.chargeVersionId
 * @param {Number} chargeVersionYear.financialYearEnding
 * @param {Boolean} chargeVersionYear.isSummer
 * @return {Promise<Array>}
 */
const processChargeVersionYear = async chargeVersionYear => {
  const { chargeVersionId, financialYearEnding, isSummer, billingBatchId } = chargeVersionYear

  const billingVolumes = await volumeMatchingService.matchVolumes(chargeVersionId, new FinancialYear(financialYearEnding), isSummer)
  decorateBillingVolumesWithBatchId(billingVolumes, billingBatchId)
  return bluebird.mapSeries(billingVolumes, billingVolumesService.persist)
}

/**
 * Processes an array of charge version years
 * @param {Array<Object>} chargeVersionYears
 * @return {Promise<Array>}
 */
const processChargeVersionYears = chargeVersionYears =>
  bluebird.mapSeries(chargeVersionYears, processChargeVersionYear)

/**
 * For a supplementary batch, we check which TPT bill runs have previously been sent in the
 * same region, and create charge version year season combinations using these bill runs
 * @param {Batch} batch
 * @return {Promise}
 */
const processSupplementaryBatch = async batch => {
  const tptBillingBatchChargeVersionYears = await chargeVersionYearService.getTwoPartTariffForBatch(batch.id)
  return processChargeVersionYears(tptBillingBatchChargeVersionYears)
}

/**
 * For a two-part tariff batch, we already know that all the water.billing_batch_charge_version_years
 * records need processing
 * @param {Batch} batch
 * @return {Promise}
 */
const processTwoPartTariffBatch = async batch => {
  const tptBillingBatchChargeVersionYears = await chargeVersionYearService.getForBatch(batch.id)
  return processChargeVersionYears(tptBillingBatchChargeVersionYears)
}

const processors = {
  [Batch.BATCH_TYPE.twoPartTariff]: processTwoPartTariffBatch,
  [Batch.BATCH_TYPE.supplementary]: processSupplementaryBatch
}

/**
 * Performs two-part tariff processing on the specified batch
 * @param {Batch} batch
 * @return {Promise}
 */
const processBatch = async batch => {
  validators.assertIsInstanceOf(batch, Batch)
  return processors[batch.type](batch)
}

exports.processBatch = processBatch
