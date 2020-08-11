'use strict';

const { flatMap } = require('lodash');

const repos = require('../../../lib/connectors/repos');

const Batch = require('../../../lib/models/batch');
const FinancialYear = require('../../../lib/models/financial-year');

const validators = require('../../../lib/models/validators');

const chargeVersionYearService = require('./charge-version-year');
const billingVolumesService = require('./billing-volumes-service');
const volumeMatchingService = require('./volume-matching-service');

/**
 * Decorates each BillingVolume in the supplied array with the
 * supplied billingBatchId property
 * @param {Array<BillingVolume>} billingVolumes
 * @param {String} billingBatchId
 */
const decorateBillingVolumesWithBatchId = (billingVolumes, billingBatchId) => {
  billingVolumes.forEach(billingVolume => {
    billingVolume.billingBatchId = billingBatchId;
  });
};

/**
 * Processes the supplied charge version year and season flag and persists
 * the billing volumes to the DB via the billing volumes service
 * @param {Object} chargeVersionYearSeason
 * @param {String} chargeVersionYearSeason.chargeVersionId
 * @param {Number} chargeVersionYearSeason.financialYearEnding
 * @param {Boolean} chargeVersionYearSeason.isSummer
 * @return {Promise<Array>}
 */
const processChargeVersionYearSeason = async chargeVersionYearSeason => {
  const { chargeVersionId, financialYearEnding, isSummer, billingBatchId } = chargeVersionYearSeason;
  const billingVolumes = await volumeMatchingService.matchVolumes(chargeVersionId, new FinancialYear(financialYearEnding), isSummer);
  decorateBillingVolumesWithBatchId(billingVolumes, billingBatchId);
  const tasks = billingVolumes.map(billingVolumesService.persist);
  return Promise.all(tasks);
};

/**
 * Processes an array of charge version year season combinations
 * @param {Array<Object>} chargeVersionYearSeasons
 * @return {Promise<Array>}
 */
const processChargeVersionYearSeasons = chargeVersionYearSeasons =>
  Promise.all(chargeVersionYearSeasons.map(
    processChargeVersionYearSeason
  ));

/**
 * Creates a charge version year season
 * This describes that a charge version needs processing for TPT in a particular financial year and season
 * @param {Object} billingBatchChargeVersionYear
 * @param {Batch} batch
 * @return {Object}
 */
const createChargeVersionYearSeason = (billingBatchChargeVersionYear, batch) => ({
  ...billingBatchChargeVersionYear,
  isSummer: batch.isSummer
});

const getChargeVersionYearSeasons = (billingBatchChargeVersionYears, previousTPTBatches) => {
  const data = previousTPTBatches.map(batch => billingBatchChargeVersionYears
    .filter(billingBatchChargeVersionYear => billingBatchChargeVersionYear.financialYearEnding === batch.toFinancialYearEnding)
    .map(billingBatchChargeVersionYear => createChargeVersionYearSeason(billingBatchChargeVersionYear, batch)));
  return flatMap(data);
};

/**
 * For a supplementary batch, we check which TPT bill runs have previously been sent in the
 * same region, and create charge version year season combinations using these bill runs
 * @param {Batch} batch
 * @return {Promise}
 */
const processSupplementaryBatch = async batch => {
  const tasks = [
    chargeVersionYearService.getTwoPartTariffForBatch(batch.id),
    repos.billingBatches.findSentTPTBatchesForRegion(batch.region.id)
  ];

  const [
    tptBillingBatchChargeVersionYears,
    previousTPTBatches
  ] = await Promise.all(tasks);

  const chargeVersionYearSeasons = getChargeVersionYearSeasons(tptBillingBatchChargeVersionYears, previousTPTBatches);
  return processChargeVersionYearSeasons(chargeVersionYearSeasons);
};

/**
 * For a two-part tariff batch, we already know that all the water.billing_batch_charge_version_years
 * records need processing
 * @param {Batch} batch
 * @return {Promise}
 */
const processTwoPartTariffBatch = async batch => {
  const tptBillingBatchChargeVersionYears = await chargeVersionYearService.getForBatch(batch.id);

  const chargeVersionYearSeasons = tptBillingBatchChargeVersionYears.map(
    billingBatchChargeVersionYear => createChargeVersionYearSeason(billingBatchChargeVersionYear, batch)
  );

  return processChargeVersionYearSeasons(chargeVersionYearSeasons);
};

const processors = {
  [Batch.BATCH_TYPE.twoPartTariff]: processTwoPartTariffBatch,
  [Batch.BATCH_TYPE.supplementary]: processSupplementaryBatch
};

/**
 * Performs two-part tariff processing on the specified batch
 * @param {Batch} batch
 * @return {Promise}
 */
const processBatch = async batch => {
  validators.assertIsInstanceOf(batch, Batch);
  return processors[batch.type](batch);
};

exports.processBatch = processBatch;
