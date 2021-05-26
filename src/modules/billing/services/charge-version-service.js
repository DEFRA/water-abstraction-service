'use strict';

const { range, flatMap, uniq } = require('lodash');
const bluebird = require('bluebird');
const helpers = require('@envage/water-abstraction-helpers').charging;

const repos = require('../../../lib/connectors/repos');
const returnRequirementVersionService = require('../../../lib/services/return-requirement-versions');
const { RETURN_SEASONS } = require('../../../lib/models/constants');
const { BATCH_TYPE, BATCH_SOURCE } = require('../../../lib/models/batch');
const { TRANSACTION_TYPE } = require('../../../lib/models/charge-version-year');
const DateRange = require('../../../lib/models/date-range');
const FinancialYear = require('../../../lib/models/financial-year');

const chargeVersionYearService = require('./charge-version-year');
const batchService = require('./batch-service');

/**
 * Creates an object which describes whether 2-part tariff billing is needed in
 * each season
 * @param {Boolean} isSummer
 * @param {Boolean} isWinterAllYear
 * @return {Object}
 */
const createTwoPartTariffBatches = (isSummer = false, isWinterAllYear = false) => ({
  [RETURN_SEASONS.summer]: isSummer,
  [RETURN_SEASONS.winterAllYear]: isWinterAllYear
});

const isNALDEraTwoPartTariffDate = date =>
  helpers.getFinancialYear(date) <= 2021;

const isWRLSEraTwoPartTariffDate = date =>
  helpers.getFinancialYear(date) >= 2021;

const isApprovedNaldBillingVolume = billingVolume =>
  billingVolume.source === BATCH_SOURCE.nald && billingVolume.isApproved;

const getIsSummer = billingVolume => billingVolume.isSummer;

/**
 * Calculates which TPT seasons are needed for NALD era transactions
 * FYE 2021 or earlier (FYE 2021 summer run in NALD)
 *
 * @param {Object} row
 * @return {Promise<Object>} { summer : true, winterAllYear : false }
 */
const getNALDTwoPartTariffSeasons = async row => {
  const financialYearEnding = helpers.getFinancialYear(row.startDate);

  // Get billing volumes, then filter to only include approved volumes from NALD
  const billingVolumes = await repos.billingVolumes.findByChargeVersionAndFinancialYear(
    row.chargeVersionId, financialYearEnding
  );
  const filteredBillingVolumes = billingVolumes.filter(isApprovedNaldBillingVolume);

  // Get unique isSummer flags
  const summerFlags = uniq(filteredBillingVolumes.map(getIsSummer));

  // Map to return seasons
  return createTwoPartTariffBatches(summerFlags.includes(true), summerFlags.includes(false));
};

/**
 * Calculates which TPT seasons are needed for WRLS era transactions
 * FYE 2021 or later (FYE 2021 winter/all year run in WRLS)
 *
 * @param {Object} row
 * @return {Promise<Object>} { summer : true, winterAllYear : false }
 */
const getWRLSTwoPartTariffSeasons = async row => {
  const chargePeriod = new DateRange(row.startDate, row.endDate);

  // There is a two-part tariff agreement - we need to look at the returns required
  // to work out which seasons
  const returnVersions = await returnRequirementVersionService.getByLicenceId(row.licenceId);

  // Filter only return versions that overlap this charge period
  const returnVersionsInChargePeriod = returnVersions.filter(
    returnVersion => returnVersion.dateRange.overlaps(chargePeriod) && returnVersion.isNotDraft
  );

  // Whether summer or winter/all year returns are due for two-part tariff applicable purposes
  const isSummer = returnVersionsInChargePeriod.some(
    returnVersion => returnVersion.hasTwoPartTariffPurposeReturnsInSeason(RETURN_SEASONS.summer)
  );

  const isWinterAllYear = returnVersionsInChargePeriod.some(
    returnVersion => returnVersion.hasTwoPartTariffPurposeReturnsInSeason(RETURN_SEASONS.winterAllYear)
  );

  return createTwoPartTariffBatches(isSummer, isWinterAllYear);
};

/**
 * Checks whether two-part tariff billing is needed for the supplied licence
 * and financial year
 * @param {Object} row - includes charge version/licence info
 * @return {Promise<Object>} includes flags for each return season
 */
const getTwoPartTariffSeasonsForChargeVersion = async row => {
  // This CV doesn't have a TPT agreement - so the CV won't be in any TPT seasons
  if (!row.isTwoPartTariff) {
    return createTwoPartTariffBatches();
  }

  // Calculate seasons in NALD and WRLS era
  const seasons = [];
  if (isNALDEraTwoPartTariffDate(row.startDate)) {
    seasons.push(await getNALDTwoPartTariffSeasons(row));
  }
  if (isWRLSEraTwoPartTariffDate(row.startDate)) {
    seasons.push(await getWRLSTwoPartTariffSeasons(row));
  }

  // OR the flags in each season
  return seasons.reduce((acc, row) => ({
    [RETURN_SEASONS.summer]: acc[RETURN_SEASONS.summer] || row[RETURN_SEASONS.summer],
    [RETURN_SEASONS.winterAllYear]: acc[RETURN_SEASONS.winterAllYear] || row[RETURN_SEASONS.winterAllYear]
  }), createTwoPartTariffBatches());
};

/**
 * Gets the return season string from the isSummer flag
 *
 * @param {Boolean} isSummer
 * @returns {String}
 */
const getReturnSeasonKey = isSummer => isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear;

/**
 * Gets the required annual transaction types for the given batch and charge version
 *
 * @returns {Array} an array of objects describing the transaction types needed, e.g. [{ type : 'two_part_tariff', isSummer: false }]
 */
const getAnnualTransactionTypes = () => ([{
  type: TRANSACTION_TYPE.annual,
  isSummer: false
}]);

/**
 * Gets the required supplementary transaction types for the given batch and charge version
 *
 * @param {Batch} batch
 * @param {Object} chargeVersion
 * @param  {Array<Batch>} existingTPTBatches - in this region and financial year
 * @returns {Promise<Array>} an array of objects describing the transaction types needed, e.g. [{ type : 'two_part_tariff', isSummer: false }]
 */
const getSupplementaryTransactionTypes = async (batch, chargeVersion, existingTPTBatches) => {
  if (!chargeVersion.includeInSupplementaryBilling) {
    return [];
  }

  const types = getAnnualTransactionTypes();

  const twoPartTariffSeasons = await getTwoPartTariffSeasonsForChargeVersion(chargeVersion);
  if (existingTPTBatches.some(existingBatch => existingBatch.isSummer) && twoPartTariffSeasons[RETURN_SEASONS.summer]) {
    types.push({ type: TRANSACTION_TYPE.twoPartTariff, isSummer: true });
  }
  if (existingTPTBatches.some(existingBatch => !existingBatch.isSummer) && twoPartTariffSeasons[RETURN_SEASONS.winterAllYear]) {
    types.push({ type: TRANSACTION_TYPE.twoPartTariff, isSummer: false });
  }

  return types;
};

/**
 * Gets the required TPT transaction types for the given batch and charge version
 *
 * @param {Batch} batch
 * @param {Object} chargeVersion
 * @returns {Promise<Array>} an array of objects describing the transaction types needed, e.g. [{ type : 'two_part_tariff', isSummer: false }]
 */
const getTwoPartTariffTransactionTypes = async (batch, chargeVersion) => {
  const twoPartTariffSeasons = await getTwoPartTariffSeasonsForChargeVersion(chargeVersion);
  if (twoPartTariffSeasons[getReturnSeasonKey(batch.isSummer)]) {
    return [
      { type: TRANSACTION_TYPE.twoPartTariff, isSummer: batch.isSummer }
    ];
  }
  return [];
};

/**
 * Gets the required transaction types for the given batch and charge version
 *
 * @param {Batch} batch
 * @param {Object} chargeVersion
 * @param  {Array<Batch>} existingTPTBatches - in this region and financial year
 * @returns {Promise<Array>} an array of objects describing the transaction types needed, e.g. [{ type : 'annual', isSummer: false }]
 */
const getRequiredTransactionTypes = async (batch, ...args) => {
  const actions = {
    [BATCH_TYPE.annual]: getAnnualTransactionTypes,
    [BATCH_TYPE.supplementary]: getSupplementaryTransactionTypes,
    [BATCH_TYPE.twoPartTariff]: getTwoPartTariffTransactionTypes
  };
  return actions[batch.type](batch, ...args);
};

/**
 * Processes the supplied charge version and financial year, within the context of the batch
 *
 * @param {Batch} batch
 * @param {FinancialYear} financialYear
 * @param {Array<Batch>} existingTPTBatches
 * @param {Object} chargeVersion
 * @returns {Promise<Array>} water.billing_batch_charge_version_year records
 */
const processChargeVersionFinancialYear = async (batch, financialYear, existingTPTBatches, chargeVersion) => {
  const transactionTypes = await getRequiredTransactionTypes(batch, chargeVersion, existingTPTBatches);

  return bluebird.mapSeries(
    transactionTypes,
    ({ type, isSummer }) => chargeVersionYearService.createBatchChargeVersionYear(batch, chargeVersion.chargeVersionId, financialYear, type, isSummer)
  );
};

/**
 * Processes the supplied batch and financial year
 *
 * @param {Batch} batch
 * @param {FinancialYear} financialYear
 * @returns {Promise<Array>} water.billing_batch_charge_version_year records
 */
const processFinancialYear = async (batch, financialYear) => {
  // Get TPT batches in year (if needed by subsequent processing)
  const existingTPTBatches = batch.type === BATCH_TYPE.supplementary
    ? await batchService.getSentTptBatchesForFinancialYearAndRegion(financialYear, batch.region)
    : [];

  // Get charge versions in financial year
  const chargeVersions = await repos.chargeVersions.findValidInRegionAndFinancialYear(
    batch.region.id, financialYear.endYear
  );

  const chargeVersionYears = await bluebird.mapSeries(
    chargeVersions,
    chargeVersion => processChargeVersionFinancialYear(batch, financialYear, existingTPTBatches, chargeVersion)
  );

  return flatMap(chargeVersionYears);
};

/**
 * Creates all the required water.billing_batch_charge_version_year records
 *
 * @param {Batch} batch
 * @returns {Promise<Array>} water.billing_batch_charge_version_year records
 */
const createForBatch = async batch => {
  const financialYears = range(batch.startYear.endYear, batch.endYear.endYear + 1);

  const chargeVersionYears = await bluebird.mapSeries(financialYears,
    financialYearEnding => processFinancialYear(batch, new FinancialYear(financialYearEnding))
  );

  return flatMap(chargeVersionYears);
};

exports.createForBatch = createForBatch;
