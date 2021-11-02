'use strict';

const { uniq } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers').charging;

const repos = require('../../../../lib/connectors/repos');
const returnRequirementVersionService = require('../../../../lib/services/return-requirement-versions');
const { RETURN_SEASONS } = require('../../../../lib/models/constants');
const { BATCH_SOURCE } = require('../../../../lib/models/batch');
const DateRange = require('../../../../lib/models/date-range');
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

const isApprovedNaldBillingVolume = billingVolume =>
  billingVolume.source === BATCH_SOURCE.nald && billingVolume.isApproved;

const getIsSummer = billingVolume => billingVolume.isSummer;

const isSummerBatch = batch => batch.isSummer === true;

const isWinterAllYearBatch = batch => batch.isSummer === false;

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

const createTwoPartTariffBatchesForSupplementary = (batches, existingTPTBatches) => ({
  [RETURN_SEASONS.summer]: batches[RETURN_SEASONS.summer] && existingTPTBatches.some(isSummerBatch),
  [RETURN_SEASONS.winterAllYear]: batches[RETURN_SEASONS.winterAllYear] && existingTPTBatches.some(isWinterAllYearBatch)
});

/**
 * Calculates which TPT seasons are needed for WRLS era transactions
 * FYE 2021 or later (FYE 2021 winter/all year run in WRLS)
 *
 * @param {Object} row
 * @param {Array<Object>} [existingTPTBatches] - supplementary only
 * @return {Promise<Object>} { summer : true, winterAllYear : false }
 */
const getWRLSTwoPartTariffSeasons = async (row, existingTPTBatches) => {
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

  const batches = createTwoPartTariffBatches(isSummer, isWinterAllYear);

  return existingTPTBatches
    ? createTwoPartTariffBatchesForSupplementary(batches, existingTPTBatches)
    : batches;
};

const isSummerFlagSet = season => season[RETURN_SEASONS.summer];

const isWinterAllYearFlagSet = season => season[RETURN_SEASONS.winterAllYear];

/**
 * Checks whether two-part tariff billing is needed for the supplied licence
 * and financial year in each season (summer and winter/all year)
 *
 * The logic is different depending on the date:
 *
 * - Pre FYE 2021 - NALD era, depends on the billing volumes found
 * - FYE 2021 - crossover year, both approaches are merged
 * - Post FYE 2021 - WRLS era, depends on return versions
 *
 * @param {Object} chargeVersionRow - includes charge version/licence info
 * @param {Array<Object>} existingTPTBatches - for supplementary only
 * @return {Promise<Object>} includes flags for each return season
 */
const getTwoPartTariffSeasonsForChargeVersion = async (chargeVersionRow, existingTPTBatches) => {
  // This CV doesn't have a TPT agreement - so the CV won't be in any TPT seasons
  if (!chargeVersionRow.isTwoPartTariff) {
    return createTwoPartTariffBatches();
  }

  // Calculate seasons in NALD and WRLS era
  const seasons = [];
  if (isNALDEraTwoPartTariffDate(chargeVersionRow.startDate)) {
    seasons.push(await getNALDTwoPartTariffSeasons(chargeVersionRow));
  }
  // always add WRLS seasons because there might be a new charge version with a historic start date
  seasons.push(await getWRLSTwoPartTariffSeasons(chargeVersionRow, existingTPTBatches));

  return {
    [RETURN_SEASONS.summer]: seasons.some(isSummerFlagSet),
    [RETURN_SEASONS.winterAllYear]: seasons.some(isWinterAllYearFlagSet)
  };
};

exports.getTwoPartTariffSeasonsForChargeVersion = getTwoPartTariffSeasonsForChargeVersion;
