'use strict';

const { flatMap, get } = require('lodash');

const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(require('moment'));

// DEFRA helpers
const helpers = require('@envage/water-abstraction-helpers');

const billingConfig = require('../../../../../config').billing;

// Service models
const DateRange = require('../../../../lib/models/date-range');
const Transaction = require('../../../../lib/models/transaction');

const { TRANSACTION_TYPE } = require('../../../../lib/models/charge-version-year');
const { getChargePeriod } = require('../../lib/charge-period');

const agreements = require('./lib/agreements');

const DATE_FORMAT = 'YYYY-MM-DD';

const isTwoPartTariffApplied = (agreement, purpose) =>
  agreement.isTwoPartTariff() && purpose.isTwoPartTariff;
/**
 * Predicate to check whether an agreement should be applied to the transaction
 * @param {Agreement} agreement
 * @param {PurposeUse} purpose
 * @return {Boolean}
 */
const agreementAppliesToTransaction = (agreement, purpose) => {
  const isCanalApplied = agreement.isCanalAndRiversTrust();
  return isCanalApplied || isTwoPartTariffApplied(agreement, purpose);
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
 * Predicate to check whether compensation charges are needed
 * @param {ChargeVersion} chargeVersion
 * @return {Boolean}
 */
const isCompensationChargesNeeded = chargeVersion => !chargeVersion.licence.isWaterUndertaker;

const isNaldTransaction = chargePeriodStartDate =>
  chargePeriodStartDate.isBefore(moment(billingConfig.naldSwitchOverDate, DATE_FORMAT));

const doesChargePeriodStartOnFirstApril = chargePeriodStartDate =>
  chargePeriodStartDate.isSame(moment(`${chargePeriodStartDate.year()}-04-01`, DATE_FORMAT), 'day');

/**
 * Predicate to check whether the minimum charge applies
 * @param {DateRange} chargePeriod of the charge element
 * @param {ChargeVersion} chargeVersion
 * @return {Boolean}
 */
const doesMinimumChargeApply = (chargePeriod, chargeVersion) => {
  const { dateRange, changeReason } = chargeVersion;
  const chargePeriodStartDate = moment(chargePeriod.startDate);

  if (isNaldTransaction(chargePeriodStartDate)) {
    return false;
  }

  const isSharedStartDate = chargePeriodStartDate.isSame(moment(dateRange.startDate), 'day');
  const isFirstChargeOnNewLicence = isSharedStartDate && get(changeReason, 'triggersMinimumCharge', false);

  return doesChargePeriodStartOnFirstApril(chargePeriodStartDate) || isFirstChargeOnNewLicence;
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

const hasTwoPartTariffAgreement = (agreements, purposeUse) => {
  const agreementsAreTwoPartTariff = agreements.map(agreement =>
    isTwoPartTariffApplied(agreement, purposeUse));
  return agreementsAreTwoPartTariff.includes(true);
};

/**
 * Create two part tariff transactions
 * @param {Object} elementChargePeriod
 * @param {ChargeElement} chargeElement
 * @param {Array} agreements
 * @param {FinancialYear} financialYear
 * @param {Array<BillingVolume>} additionalData.billingVolumes volumes
 * @return {Array<Transaction>}
 */
const createTwoPartTariffTransactions = (elementChargePeriod, chargeElement, agreements, financialYear, additionalData) => {
  const { billingVolumes } = additionalData;
  const transactions = [];
  const elementBillingVolumes = getBillingVolumesForChargeElement(chargeElement, billingVolumes);
  elementBillingVolumes.forEach(billingVolume => {
    if (hasTwoPartTariffAgreement(agreements, chargeElement.purposeUse)) {
      transactions.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isTwoPartTariffSupplementary: true }, billingVolume));
    }
  });

  return transactions;
};

/**
 * Create annual transactions
 * @param {Object} elementChargePeriod
 * @param {ChargeElement} chargeElement
 * @param {Array} agreements
 * @param {FinancialYear} financialYear
 * @param {ChargeVersion} additionalData.chargeVersion volumes
 * @return {Array<Transaction>}
 */
const createAnnualAndCompensationTransactions = (elementChargePeriod, chargeElement, agreements, financialYear, additionalData) => {
  const { chargeVersion } = additionalData;
  const isMinimumCharge = doesMinimumChargeApply(elementChargePeriod, chargeVersion);

  const transactions = [createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isMinimumCharge })];

  if (isCompensationChargesNeeded(chargeVersion)) {
    transactions.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isCompensationCharge: true, isMinimumCharge }));
  }
  return transactions;
};

const actions = {
  [TRANSACTION_TYPE.annual]: createAnnualAndCompensationTransactions,
  [TRANSACTION_TYPE.twoPartTariff]: createTwoPartTariffTransactions
};

const createTransactionsForPeriod = (chargeVersionYear, period, billingVolumes) => {
  const { chargeVersion, financialYear, transactionType } = chargeVersionYear;
  const { agreements, dateRange } = period;

  return chargeVersion.chargeElements.reduce((acc, chargeElement) => {
    const elementChargePeriod = getElementChargePeriod(dateRange, chargeElement);
    if (!elementChargePeriod) {
      return acc;
    }
    const additionalData = { chargeVersion, billingVolumes };
    acc.push(...actions[transactionType](elementChargePeriod, chargeElement, agreements, financialYear, additionalData));
    return acc;
  }, []);
};

/**
 * Create two part tariff transactions
 * @param {ChargeVersionYear} chargeVersionYear
 * @param {Array<BillingVolume>} billingVolumes - all billing volumes in DB matching charge element IDs
 * @return {Array<Transaction>}
 */
const createTransactions = (chargeVersionYear, billingVolumes) => {
  const { chargeVersion, financialYear } = chargeVersionYear;
  const chargePeriod = getChargePeriod(financialYear, chargeVersion);

  // Create a history for the financial year, taking into account agreements
  const history = agreements.getAgreementsHistory(chargePeriod, chargeVersion.licence.licenceAgreements);

  // Create transactions for each period in the history
  const transactions = history.map(period =>
    createTransactionsForPeriod(chargeVersionYear, period, billingVolumes));

  return flatMap(transactions);
};

exports.createTransactions = createTransactions;
