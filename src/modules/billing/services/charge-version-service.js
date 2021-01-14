'use strict';

const { range, flatMap } = require('lodash');
const bluebird = require('bluebird');

const repos = require('../../../lib/connectors/repos');
const returnRequirementVersionService = require('../../../lib/services/return-requirement-versions');
const { RETURN_SEASONS } = require('../../../lib/models/constants');
const { BATCH_TYPE } = require('../../../lib/models/batch');
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

/**
 * Checks whether two-part tariff billing is needed for the supplied licence
 * and financial year
 * @param {Object} row - includes charge version/licence info
 * @return {Promise<Object>} includes flags for each return season
 */
const isTwoPartTariffBillingNeeded = async row => {
  if (!row.isTwoPartTariff) {
    return createTwoPartTariffBatches();
  }
  // There is a two-part tariff agreement - we need to look at the returns required
  // to work out which seasons
  const returnVersions = await returnRequirementVersionService.getByLicenceId(row.licenceId);
  // Filter only return versions that overlap this charge period
  const chargePeriod = new DateRange(row.startDate, row.endDate);

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
 * Persists a charge version year record for processing in this batch
 * @param {Batch} batch
 * @param {String} chargeVersionId
 * @param {FinancialYear} financialYear
 * @param {String} transactionType
 * @param {Boolean} isSummer
 */
const createChargeVersionYear = async (batch, chargeVersionId, financialYear, transactionType, isSummer) =>
  chargeVersionYearService.createBatchChargeVersionYear(batch, chargeVersionId, financialYear, transactionType, isSummer);

/**
 * Persists multiple charge version year records for processing in the batch
 * @param {Batch} batch
 * @param {Array<Object>} chargeVersions
 * @param {FinancialYear} financialYear
 * @param {String} transactionType
 * @param {Boolean} isSummer
 * @return {Array<Object>} billing_batch_charge_version_years
 */
const createChargeVersionYears = (batch, chargeVersions, financialYear, transactionType, isSummer) => {
  const tasks = chargeVersions.map(chargeVersion => createChargeVersionYear(batch, chargeVersion.chargeVersionId, financialYear, transactionType, isSummer));
  return Promise.all(tasks);
};

const isTwoPartNeeded = async (chargeVersion, isSummer) => {
  const isTwoPartNeededBySeason = await isTwoPartTariffBillingNeeded(chargeVersion);
  const key = isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear;
  return isTwoPartNeededBySeason[key];
};

/**
 * A predicate which checks whether the supplied charge version should be included
 * in the supplied two-part tariff batch
 * @param {Object} context - contains charge version, batch and financial year data
 * @return {Promise<Boolean>}
 */
const isRequiredInTwoPartTariffBillRun = async context => {
  const { chargeVersion, batch } = context;

  const isTwoPartNeededVal = await isTwoPartNeeded(chargeVersion, batch.isSummer);
  return isTwoPartNeededVal;
};

const isRequiredInTwoPartTariffSupplementary = async (chargeVersion, isSummer) =>
  (!chargeVersion.isTwoPartTariff)
    ? false
    : isTwoPartNeeded(chargeVersion, isSummer);

const isRequiredInSupplementaryBillRun = async context => {
  const { chargeVersion, transactionType, isSummer } = context;
  if (chargeVersion.includeInSupplementaryBilling) {
    // recreating a TPT run?
    if (transactionType === TRANSACTION_TYPE.twoPartTariff) {
      return isRequiredInTwoPartTariffSupplementary(chargeVersion, isSummer);
    }
    return true;
  }
  return false;
};

const chargeVersionFilters = {
  [BATCH_TYPE.annual]: () => true,
  [BATCH_TYPE.supplementary]: isRequiredInSupplementaryBillRun,
  [BATCH_TYPE.twoPartTariff]: isRequiredInTwoPartTariffBillRun
};

/**
 * Creates charge version years for the supplied batch and financial year
 * @param {Batch} batch
 * @param {FinancialYear} financialYear
 * @param {String} transactionType annual or two_part_tariff
 * @param {Boolean} isSummer
 * @return {Promise<Array>} resolves with array of water.billing_batch_charge_version_years
 */
const createFinancialYearChargeVersionYears = async (batch, financialYear, transactionType, isSummer) => {
  // Get all charge versions and other flags for any bill run type

  const chargeVersions = await repos.chargeVersions.findValidInRegionAndFinancialYear(
    batch.region.id, financialYear.endYear
  );

  // Filter depending on bill run type
  const chargeVersionsWithContext = chargeVersions.map(chargeVersion => ({ chargeVersion, batch, transactionType, isSummer }));

  const filteredChargeVersionYears = (await bluebird.filter(
    chargeVersionsWithContext,
    chargeVersionFilters[batch.type]
  )).map(row => row.chargeVersion);

  // Persist the charge version years
  return createChargeVersionYears(batch, filteredChargeVersionYears, financialYear, transactionType, isSummer);
};

/**
 * Creates the charge version years for an annual batch
 * @param {Batch} batch
 * @return {Promise<Array>}
 */
const createAnnual = batch => createFinancialYearChargeVersionYears(batch, batch.endYear, TRANSACTION_TYPE.annual, false);

/**
 * Creates the charge version years for a two-part tariff batch
 * @param {Batch} batch
 * @return {Promise<Array>}
 */
const createTwoPartTariff = batch => createFinancialYearChargeVersionYears(batch, batch.endYear, TRANSACTION_TYPE.twoPartTariff, batch.isSummer);

/**
 * Get TPT batches for the same region and financial years
 * @param {Batch} batch supplementary batch
 */
const getSentTptBatchesInRegionAndFinancialYear = async (financialYears, region) => {
  const tasks = financialYears.map(
    financialYear => batchService.getSentTptBatchesForFinancialYearAndRegion({ yearEnding: financialYear }, region)
  );

  const sentTptBatches = await Promise.all(tasks);
  return flatMap(sentTptBatches);
};

const chargeVersionYearsDataFromSentTptBatch = (finYearEnding, sentTptBatches) =>
  sentTptBatches.filter(batch => batch.endYear.endYear === finYearEnding)
    .map(batch => ({
      financialYear: new FinancialYear(finYearEnding),
      transactionType: TRANSACTION_TYPE.twoPartTariff,
      isSummer: batch.isSummer
    }));

const annualChargeVersionYearData = finYearEnding => ({
  financialYear: new FinancialYear(finYearEnding),
  transactionType: TRANSACTION_TYPE.annual,
  isSummer: false
});

const getChargeVersionYearsData = (financialYears, sentTptBatches) =>
  financialYears.reduce((chargeVersionYearsData, finYearEnding) => {
    chargeVersionYearsData.push(annualChargeVersionYearData(finYearEnding));
    chargeVersionYearsData.push(...chargeVersionYearsDataFromSentTptBatch(finYearEnding, sentTptBatches));
    return chargeVersionYearsData;
  }, []);

const getFinancialYearsWithTransactionTypeAndSeason = async batch => {
  const financialYears = range(batch.startYear.endYear, batch.endYear.endYear + 1);
  const batches = await getSentTptBatchesInRegionAndFinancialYear(financialYears, batch.region);
  return getChargeVersionYearsData(financialYears, batches);
};

/**
 * Creates the charge version years for a supplementary
 * @param {Batch} batch
 * @return {Promise<Array>}
 */
const createSupplementary = async batch => {
  const financialYears = await getFinancialYearsWithTransactionTypeAndSeason(batch);
  const tasks = financialYears.map(
    financialYear => createFinancialYearChargeVersionYears(
      batch,
      financialYear.financialYear,
      financialYear.transactionType,
      financialYear.isSummer)
  );

  const financialYearChargeVersionYears = await Promise.all(tasks);

  return flatMap(financialYearChargeVersionYears);
};

/**
 * Creates the charge version years for any batch type
 * @param {Batch} batch
 * @return {Promise<Array>}
 */
const createForBatch = batch => {
  const actions = {
    [BATCH_TYPE.annual]: createAnnual,
    [BATCH_TYPE.supplementary]: createSupplementary,
    [BATCH_TYPE.twoPartTariff]: createTwoPartTariff
  };
  return actions[batch.type](batch);
};

exports.createForBatch = createForBatch;
