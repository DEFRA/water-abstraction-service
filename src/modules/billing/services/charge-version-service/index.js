'use strict';

const { range, flatMap } = require('lodash');
const bluebird = require('bluebird');

const repos = require('../../../../lib/connectors/repos');
const twoPartTariffSeasonsService = require('./two-part-tariff-seasons');

const { RETURN_SEASONS } = require('../../../../lib/models/constants');
const { BATCH_TYPE } = require('../../../../lib/models/batch');
const { TRANSACTION_TYPE } = require('../../../../lib/models/charge-version-year');
const FinancialYear = require('../../../../lib/models/financial-year');
const chargeVersionService = require('../../../../lib/services/charge-versions');
const chargeVersionYearService = require('../charge-version-year');
const batchService = require('../batch-service');
const DateRange = require('../../../../lib/models/date-range');

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
const getAnnualTransactionTypes = () => (
  {
    types: [{
      type: TRANSACTION_TYPE.annual,
      isSummer: false
    }],
    chargeVersionHasAgreement: false
  }
);

const chargeVersionHasTwoPartAgreement = (chargeVersionWithRelated, chargeVersion) => {
  const chargeVersionDateRange = new DateRange(chargeVersion.startDate, chargeVersion.endDate);

  return chargeVersionWithRelated.licence.licenceAgreements.some(licAgreement => {
    return licAgreement.dateDeleted === null &&
       licAgreement.dateRange.overlaps(chargeVersionDateRange) &&
       licAgreement.agreement.code === 'S127';
  }) || false;
};

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
    return { types: [], chargeVersionHasAgreement: false };
  }

  const transactionTypesWithTwoPartAgreementFlag = getAnnualTransactionTypes();
  const chargeVersionWithRelated = await chargeVersionService.getByChargeVersionId(chargeVersion.chargeVersionId);

  if (chargeVersionHasTwoPartAgreement(chargeVersionWithRelated, chargeVersion)) {
    const twoPartTariffSeasons = await twoPartTariffSeasonsService.getTwoPartTariffSeasonsForChargeVersion(chargeVersion, existingTPTBatches);

    // find historic 2PT batch types for financial year
    const historicTransactionTypes = existingTPTBatches.reduce((acc, batchRow) => {
      if (batchRow.type === BATCH_TYPE.twoPartTariff) {
        acc.push(batchRow.isSummer ? 'summer' : 'winter');
      }
      return acc;
    }, []);

    if (twoPartTariffSeasons[RETURN_SEASONS.summer] && (historicTransactionTypes.includes('summer'))) {
      transactionTypesWithTwoPartAgreementFlag.types.push({ type: TRANSACTION_TYPE.twoPartTariff, isSummer: true });
    }
    if (twoPartTariffSeasons[RETURN_SEASONS.winterAllYear] && (historicTransactionTypes.includes('winter'))) {
      transactionTypesWithTwoPartAgreementFlag.types.push({ type: TRANSACTION_TYPE.twoPartTariff, isSummer: false });
    }
    transactionTypesWithTwoPartAgreementFlag.chargeVersionHasAgreement = true;
  }

  return transactionTypesWithTwoPartAgreementFlag;
};

/**
 * Gets the required TPT transaction types for the given batch and charge version
 *
 * @param {Batch} batch
 * @param {Object} chargeVersion
 * @returns {Promise<Array>} an array of objects describing the transaction types needed, e.g. [{ type : 'two_part_tariff', isSummer: false }]
 */
const getTwoPartTariffTransactionTypes = async (batch, chargeVersion) => {
  const twoPartTariffSeasons = await twoPartTariffSeasonsService.getTwoPartTariffSeasonsForChargeVersion(chargeVersion);
  if (twoPartTariffSeasons[getReturnSeasonKey(batch.isSummer)]) {
    return {
      types: [{ type: TRANSACTION_TYPE.twoPartTariff, isSummer: batch.isSummer }],
      chargeVersionHasAgreement: true
    };
  }
  return {
    types: [],
    chargeVersionHasAgreement: false
  };
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
  if (!chargeVersion.isChargeable && batch.type === BATCH_TYPE.supplementary) {
    return chargeVersionYearService.createBatchChargeVersionYear(batch, chargeVersion.chargeVersionId, financialYear, 'annual', false, false, false);
  } else {
    const { types, chargeVersionHasAgreement } = await getRequiredTransactionTypes(batch, chargeVersion, existingTPTBatches);
    return bluebird.mapSeries(
      types,
      ({ type, isSummer }) => chargeVersionYearService.createBatchChargeVersionYear(batch, chargeVersion.chargeVersionId, financialYear, type, isSummer, chargeVersionHasAgreement)
    );
  }
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
    batch.region.id, financialYear.endYear, batch.type === BATCH_TYPE.supplementary
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
// these are only exported for testing
exports._getAnnualTransactionTypes = getAnnualTransactionTypes;
exports._getTwoPartTariffTransactionTypes = getTwoPartTariffTransactionTypes;
exports._getSupplementaryTransactionTypes = getSupplementaryTransactionTypes;
