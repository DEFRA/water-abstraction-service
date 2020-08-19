'use strict';

const { range, flatMap } = require('lodash');
const bluebird = require('bluebird');

const repos = require('../../../lib/connectors/repos');
const returnRequirementVersionService = require('../../../lib/services/return-requirement-versions');
const mappers = require('../mappers');
const { RETURN_SEASONS } = require('../../../lib/models/constants');
const { BATCH_TYPE } = require('../../../lib/models/batch');
const DateRange = require('../../../lib/models/date-range');
const FinancialYear = require('../../../lib/models/financial-year');

const chargeVersionYearService = require('./charge-version-year');

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
 * @param {FinancialYear} financialYear
 * @return {Promise<Object>} includes flags for each return season
 */
const isTwoPartTariffBillingNeeded = async (row, financialYear) => {
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
 */
const createChargeVersionYear = async (batch, chargeVersionId, financialYear) => {
  const tasks = [
    repos.billingBatchChargeVersions.create(batch.id, chargeVersionId),
    chargeVersionYearService.createBatchChargeVersionYear(batch, chargeVersionId, financialYear)
  ];
  const [, billingBatchChargeVersionYear] = await Promise.all(tasks);
  return billingBatchChargeVersionYear;
};

/**
 * Persists multiple charge version year records for processing in the batch
 * @param {Batch} batch
 * @param {Array<Object>} chargeVersions
 * @param {FinancialYear} financialYear
 * @return {Array<Object>} billing_batch_charge_version_years
 */
const createChargeVersionYears = (batch, chargeVersions, financialYear) => {
  const tasks = chargeVersions.map(chargeVersion => createChargeVersionYear(batch, chargeVersion.chargeVersionId, financialYear));
  return Promise.all(tasks);
};

/**
 * A predicate which checks whether the supplied charge version should be included
 * in the supplied two-part tariff batch
 * @param {Object} context - contains charge version, batch and financial year data
 * @return {Promise<Boolean>}
 */
const isRequiredInTwoPartTariffBillRun = async context => {
  const { chargeVersion, batch, financialYear } = context;
  const isTwoPartNeeded = await isTwoPartTariffBillingNeeded(chargeVersion, financialYear);
  const key = batch.isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear;
  return isTwoPartNeeded[key];
};

const chargeVersionFilters = {
  [BATCH_TYPE.annual]: () => true,
  [BATCH_TYPE.supplementary]: context => context.chargeVersion.includeInSupplementaryBilling,
  [BATCH_TYPE.twoPartTariff]: isRequiredInTwoPartTariffBillRun
};

/**
 * Creates charge version years for the supplied batch and financial year
 * @param {Batch} batch
 * @param {FinancialYear} financialYear
 * @return {Promise<Array>} resolves with array of water.billing_batch_charge_version_years
 */
const createFinancialYearChargeVersionYears = async (batch, financialYear) => {
  // Get all charge versions and other flags for any bill run type
  const chargeVersions = await repos.chargeVersions.findValidInRegionAndFinancialYear(
    batch.region.id, financialYear.endYear
  );

  // Filter depending on bill run type
  const chargeVersionsWithContext = chargeVersions.map(chargeVersion => ({ chargeVersion, batch, financialYear }));

  const filteredChargeVersionYears = (await bluebird.filter(
    chargeVersionsWithContext,
    chargeVersionFilters[batch.type]
  )).map(row => row.chargeVersion);

  // Persist the charge version years
  return createChargeVersionYears(batch, filteredChargeVersionYears, financialYear);
};

/**
 * Creates the charge version years for an annual batch
 * @param {Batch} batch
 * @return {Promise<Array>}
 */
const createAnnual = batch => createFinancialYearChargeVersionYears(batch, batch.endYear);

/**
 * Creates the charge version years for a two-part tariff batch
 * @param {Batch} batch
 * @return {Promise<Array>}
 */
const createTwoPartTariff = batch => createFinancialYearChargeVersionYears(batch, batch.endYear);

/**
 * Creates the charge version years for a supplementary
 * @param {Batch} batch
 * @return {Promise<Array>}
 */
const createSupplementary = async batch => {
  const financialYears = range(batch.startYear.endYear, batch.endYear.endYear + 1)
    .map(finYearEnding => new FinancialYear(finYearEnding));

  const tasks = financialYears.map(
    financialYear => createFinancialYearChargeVersionYears(batch, financialYear)
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

/**
 * Gets charge version by ID
 * @param {String} chargeVersionId
 * @return {Promise<ChargeVersion>}
 */
const getByChargeVersionId = async chargeVersionId => {
  // Fetch DB data
  const data = await repos.chargeVersions.findOne(chargeVersionId);
  return mappers.chargeVersion.dbToModel(data);
};

exports.createForBatch = createForBatch;
exports.getByChargeVersionId = getByChargeVersionId;
