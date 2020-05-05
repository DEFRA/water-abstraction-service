'use strict';

const { isNull, flatMap } = require('lodash');

const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(require('moment'));

// DEFRA helpers
const helpers = require('@envage/water-abstraction-helpers');

// Service models
const Batch = require('../../../../lib/models/batch');
const ChargeVersion = require('../../../../lib/models/charge-version');
const FinancialYear = require('../../../../lib/models/financial-year');
const DateRange = require('../../../../lib/models/date-range');
const Transaction = require('../../../../lib/models/transaction');

const dateHelpers = require('../../service/charge-processor/date-helpers');
const validators = require('../../../../lib/models/validators');

const agreements = require('./lib/agreements');

const DATE_FORMAT = 'YYYY-MM-DD';

const dateToString = date => isNull(date) ? null : moment(date).format('YYYY-MM-DD');

/**
 * Gets the base charge period
 * Normally this will be the financial year, but could be constrained
 * by licence or charge version start/end dates
 *
 * @param {FinancialYear} financialYear
 * @param {ChargeVersion} chargeVersion
 * @return {DateRange}
 */
const getChargePeriod = (financialYear, chargeVersion) => {
  const startDate = dateHelpers.getMaxDate([
    chargeVersion.licence.startDate,
    financialYear.start,
    chargeVersion.dateRange.startDate
  ]);

  const endDate = dateHelpers.getMinDate([
    chargeVersion.licence.endDate,
    financialYear.end,
    chargeVersion.dateRange.endDate
  ]);
  return new DateRange(dateToString(startDate), dateToString(endDate));
};

/**
 * Predicate to check whether the supplied purpose is applicable for two-part tariff discounts
 * @param {Purpose} purpose
 * @return {Boolean}
 */
const isTwoPartPurpose = purpose => {
  const SPRAY_IRRIGATION_DIRECT = 400;
  const TRICKLE_IRRIGATION_DIRECT = 600;
  return [SPRAY_IRRIGATION_DIRECT, TRICKLE_IRRIGATION_DIRECT].includes(purpose.code);
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
 * @return {Transaction}
 */
const createTransaction = (chargePeriod, chargeElement, agreements, financialYear, flags = {}) => {
  const absPeriod = chargeElement.abstractionPeriod.toJSON();
  const transaction = new Transaction();
  transaction.fromHash({
    ...flags,
    chargeElement,
    agreements: agreements,
    chargePeriod,
    status: Transaction.statuses.candidate,
    totalDays: helpers.charging.getBillableDays(absPeriod, financialYear.startDate, financialYear.endDate),
    billableDays: helpers.charging.getBillableDays(absPeriod, chargePeriod.startDate, chargePeriod.endDate)
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
 * @return {Boolean}
 */
const isTwoPartTariffSupplementaryChargesNeeded = (batch, period, chargeElement) => {
  const isCorrectBatchType = batch.isTwoPartTariff() || batch.isSupplementary();
  const isAgreementInEffect = period.agreements.some(agreement => agreement.code === 'S127');
  const isValidPurpose = isTwoPartPurpose(chargeElement.purposeUse);
  return isCorrectBatchType && isAgreementInEffect && isValidPurpose;
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
 * Gets an array of Transaction models for the supplied charge version/batch
 * @param {Batch} batch
 * @param {Object} period - an object containing a date range and array of applicable Agreements
 * @param {ChargeVersion} chargeVersion
 * @param {FinancialYear} financialYear
 * @return {Array<Transaction>}
 */
const createTransactionsForPeriod = (batch, period, chargeVersion, financialYear) => {
  const { agreements } = period;

  return chargeVersion.chargeElements.reduce((acc, chargeElement) => {
    const elementChargePeriod = getElementChargePeriod(period, chargeElement);
    if (!elementChargePeriod) {
      return acc;
    }

    if (isAnnualChargesNeeded(batch)) {
      acc.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear));
    }
    if (isCompensationChargesNeeded(batch, chargeVersion)) {
      acc.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isCompensationCharge: true }));
    }
    if (isTwoPartTariffSupplementaryChargesNeeded(batch, period, chargeElement)) {
      // @TODO include two-part tariff reported volume
      acc.push(createTransaction(elementChargePeriod, chargeElement, agreements, financialYear, { isTwoPartTariffSupplementary: true }));
    }
    return acc;
  }, []);
};

const createTransactions = (batch, financialYear, chargeVersion) => {
  // Validation
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertIsInstanceOf(financialYear, FinancialYear);
  validators.assertIsInstanceOf(chargeVersion, ChargeVersion);

  const chargePeriod = getChargePeriod(financialYear, chargeVersion);

  // Create a history for the financial year, taking into account agreements
  const history = agreements.getAgreementsHistory(chargePeriod, chargeVersion.licence.licenceAgreements);

  // Create transactions for each period in the history
  const transactions = history.map(period =>
    createTransactionsForPeriod(batch, period, chargeVersion, financialYear));

  return flatMap(transactions);
};

exports.createTransactions = createTransactions;
