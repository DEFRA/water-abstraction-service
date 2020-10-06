'use strict';

const { flatMap, get } = require('lodash');

const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(require('moment'));

// DEFRA helpers
const helpers = require('@envage/water-abstraction-helpers');

// Service models
const Batch = require('../../../../lib/models/batch');
const BillingVolume = require('../../../../lib/models/billing-volume');
const ChargeVersion = require('../../../../lib/models/charge-version');
const FinancialYear = require('../../../../lib/models/financial-year');
const DateRange = require('../../../../lib/models/date-range');
const Transaction = require('../../../../lib/models/transaction');

const { getChargePeriod } = require('../../lib/charge-period');

const validators = require('../../../../lib/models/validators');

const agreements = require('./lib/agreements');

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Predicate to check whether an agreement should be applied to the transaction
 * @param {Agreement} agreement
 * @param {PurposeUse} purpose
 * @return {Boolean}
 */
const agreementAppliesToTransaction = (agreement, purpose) => {
  const isCanalApplied = agreement.isCanalAndRiversTrust();
  const isTwoPartTariffApplied = agreement.isTwoPartTariff() && purpose.isTwoPartTariff;
  return isCanalApplied || isTwoPartTariffApplied;
};

/**
 * Creates a Transaction model
 * @param {DateRange} chargePeriod - charge period for this charge element - taking time-limits into account
 * @param {ChargeElement} chargeElement
 * @param {Array<Agreement>} agreements
 * @param {FinancialYear} financialYear
 * @param {Object} flags
 * @param {Boolean} flags.isCompensationCharge
 * @param {Boolean} flags.isTwoPartTariffSupplementary
 * @param {Boolean} flags.isMinimumCharge
 * @return {Transaction}
 */
const createTransaction = (chargePeriod, chargeElement, agreements, financialYear, flags = {}, billingVolume) => {
  const absPeriod = chargeElement.abstractionPeriod.toJSON();
  const transaction = new Transaction();
  transaction.fromHash({
    ...flags,
    chargeElement,
    agreements: agreements.filter(agreement => agreementAppliesToTransaction(agreement, chargeElement.purposeUse)),
    chargePeriod,
    status: Transaction.statuses.candidate,
    authorisedDays: helpers.charging.getBillableDays(absPeriod, financialYear.start.format(DATE_FORMAT), financialYear.end.format(DATE_FORMAT)),
    billableDays: helpers.charging.getBillableDays(absPeriod, chargePeriod.startDate, chargePeriod.endDate),
    volume: billingVolume ? billingVolume.volume : chargeElement.volume,
    isTwoPartTariffSupplementary: flags.isTwoPartTariffSupplementary || false,
    isCompensationCharge: flags.isCompensationCharge || false,
    isNewLicence: flags.isMinimumCharge || false
  });
  transaction.createDescription();
  return transaction;
};

/**
 * Predicate to check whether annual transactions are needed
 * @param {Batch} batch
 * @return {Boolean}
 */
const isAnnualChargesNeeded = batch => batch.isAnnual() || batch.isSupplementary();

/**
 * Predicate to check whether two-part supplementary transactions are needed
 * @param {Batch} batch
 * @param {Object} period
 * @param {ChargeElement} chargeElement
 * @param {BillingVolume} billingVolume
 * @return {Boolean}
 */
const isTwoPartTariffSupplementaryChargeNeeded = (batch, period, chargeElement, billingVolume) => {
  const isCorrectBatchType = batch.isTwoPartTariff() || batch.isSupplementary();
  const isCorrectSeason = batch.isSupplementary() || (batch.isSummer === billingVolume.isSummer);
  const isAgreementInEffect = period.agreements.some(agreement => agreement.code === 'S127');
  const isValidPurpose = chargeElement.purposeUse.isTwoPartTariff;
  return isCorrectBatchType && isAgreementInEffect && isValidPurpose && isCorrectSeason;
};

/**
 * Predicate to check whether compensation charges are needed
 * @param {Batch} batch
 * @param {ChargeVersion} chargeVersion
 * @return {Boolean}
 */
const isCompensationChargesNeeded = (batch, chargeVersion) => {
  return isAnnualChargesNeeded(batch) && !chargeVersion.licence.isWaterUndertaker;
};

/**
 * Predicate to check whether the minimum charge applies
 * @param {DateRange} chargePeriod of the charge element
 * @param {ChargeVersion} chargeVersion
 * @return {Boolean}
 */
const doesMinimumChargeApply = (chargePeriod, chargeVersion) => {
  const { dateRange, changeReason } = chargeVersion;
  const chargeVersionStartDate = moment(dateRange.startDate);
  const isSharedStartDate = moment(chargePeriod.startDate).isSame(chargeVersionStartDate, 'day');
  return isSharedStartDate && get(changeReason, 'triggersMinimumCharge', false);
};

/**
 * Gets the charge period for the element, taking into account the time-limited
 * dates.  If the time limit does not overlap with the supplied period, returns null
 * @param {Object} period
 * @param {String} period.startDate - YYYY-MM-DD
 * @param {String} period.endDate - YYYY-MM-DD
 * @param {ChargeElement} chargeElement
 * @return {DateRange|null}
 */
const getElementChargePeriod = (period, chargeElement) => {
  const { timeLimitedPeriod } = chargeElement;

  if (!timeLimitedPeriod) {
    return new DateRange(period.startDate, period.endDate);
  }

  const rangeA = moment.range(period.startDate, period.endDate);
  const rangeB = moment.range(timeLimitedPeriod.startDate, timeLimitedPeriod.endDate);

  const intersection = rangeA.intersect(rangeB);

  if (!intersection) {
    return null;
  }

  const startDate = intersection.start.format(DATE_FORMAT);
  const endDate = intersection.end.format(DATE_FORMAT);

  return new DateRange(startDate, endDate);
};

/**
 * Gets the summer and winter/all year billing volume
 * @param {ChargeElement} chargeElement
 * @param {Array<BillingVolume>} billingVolumes
 */
const getBillingVolumesForChargeElement = (chargeElement, billingVolumes) => billingVolumes.filter(
  billingVolume => billingVolume.chargeElementId === chargeElement.id
);

/**
 * Gets an array of Transaction models for the supplied charge version/batch
 * @param {Batch} batch
 * @param {Object} period - an object containing a date range and array of applicable Agreements
 * @param {ChargeVersion} chargeVersion
 * @param {FinancialYear} financialYear
 * @param {Array<BillingVolume>} billing volumes
 * @return {Array<Transaction>}
 */
const createTransactionsForPeriod = (batch, period, chargeVersion, financialYear, billingVolumes) => {
  const { agreements, dateRange } = period;

  return chargeVersion.chargeElements.reduce((acc, chargeElement) => {
    const elementChargePeriod = getElementChargePeriod(dateRange, chargeElement);
    if (!elementChargePeriod) {
      return acc;
    }
    const isMinimumCharge = doesMinimumChargeApply(elementChargePeriod, chargeVersion);

    if (isAnnualChargesNeeded(batch)) {
      acc.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isMinimumCharge }));
    }
    if (isCompensationChargesNeeded(batch, chargeVersion)) {
      acc.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isCompensationCharge: true, isMinimumCharge }));
    }

    // Two-part tariff transactions:
    const elementBillingVolumes = getBillingVolumesForChargeElement(chargeElement, billingVolumes);
    elementBillingVolumes.forEach(billingVolume => {
      if (isTwoPartTariffSupplementaryChargeNeeded(batch, period, chargeElement, billingVolume)) {
        acc.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isTwoPartTariffSupplementary: true }, billingVolume));
      }
    });

    return acc;
  }, []);
};

/**
 * Create transactions
 * @param {Batch} batch
 * @param {FinancialYear} financialYear
 * @param {ChargeVersion} chargeVersion
 * @param {Array<BillingVolume>} billingVolumes - all billing volumes in DB matching charge element IDs
 * @return {Array<Transaction>}
 */
const createTransactions = (batch, financialYear, chargeVersion, billingVolumes) => {
  // Validation
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertIsInstanceOf(financialYear, FinancialYear);
  validators.assertIsInstanceOf(chargeVersion, ChargeVersion);
  validators.assertIsArrayOfType(billingVolumes, BillingVolume);

  const chargePeriod = getChargePeriod(financialYear, chargeVersion);

  // Create a history for the financial year, taking into account agreements
  const history = agreements.getAgreementsHistory(chargePeriod, chargeVersion.licence.licenceAgreements);

  // Create transactions for each period in the history
  const transactions = history.map(period =>
    createTransactionsForPeriod(batch, period, chargeVersion, financialYear, billingVolumes));

  return flatMap(transactions);
};

exports.createTransactions = createTransactions;
