'use strict';
const { pick } = require('lodash');

const Model = require('./model');
const Agreement = require('./agreement');
const DateRange = require('./date-range');
const {
  assertString,
  assertIsBoolean,
  assertDaysInYear,
  assertIsArrayOfType,
  assertIsInstanceOf,
  assertEnum
} = require('./validators');

const { sources, seasons, losses } = require('./charge-element');

class Transaction extends Model {
  constructor (id, value, isCredit = false) {
    super(id);
    this.value = value;
    this.isCredit = isCredit;
    this._agreements = [];
  }

  /**
   * Extracts a subset of the ChargeModuleTransaction object data and returns
   * a Transaction model
   * @param {ChargeModuleTransaction} chargeModuleTransaction The source data
   */
  static fromChargeModuleTransaction (chargeModuleTransaction) {
    const transaction = new Transaction();
    transaction.fromHash(pick(chargeModuleTransaction, ['value', 'isCredit']));
    return transaction;
  }

  get value () {
    return this._value;
  }

  set value (value) {
    this._value = value;
  }

  get isCredit () {
    return this._isCredit;
  }

  set isCredit (isCredit) {
    assertIsBoolean(isCredit);
    this._isCredit = isCredit;
  }

  /**
   * The number of days in a full financial year that water
   * can be taken - taking the abstraction period into account
   * @return {Number}
   */
  get authorisedDays () {
    return this._authorisedDays;
  }

  set authorisedDays (days) {
    assertDaysInYear(days);
    this._authorisedDays = days;
  }

  /**
   * The number of days for charging, taking into account the
   * abstraction period and the charge period
   * @return {Number}
   */
  get billableDays () {
    return this._billableDays;
  }

  set billableDays (days) {
    assertDaysInYear(days);
    this._billableDays = days;
  }

  /**
   * Agreements can be e.g.
   * Section 127 - two part tariff
   * Section 130 - Canal & Rivers Trust
   * @return {Array}
   */
  get agreements () {
    return this._agreements;
  }

  set agreements (agreements) {
    assertIsArrayOfType(agreements, Agreement);
    this._agreements = agreements;
  }

  /**
   * The period of time this charge covers - usually financial
   * year but can be limited by changes to licence or charge version
   * @return {DateRange}
   */
  get chargePeriod () {
    return this._chargePeriod;
  }

  set chargePeriod (dateRange) {
    assertIsInstanceOf(dateRange, DateRange);
    this._chargePeriod = dateRange;
  }

  /**
   * Whether this transaction is a compensation charge
   * @return {Boolean}
   */
  get isCompensationCharge () {
    return this._isCompensationCharge;
  }

  set isCompensationCharge (isCompensationCharge) {
    assertIsBoolean(isCompensationCharge);
    this._isCompensationCharge = isCompensationCharge;
  }

  /**
   * Whether the transaction is a two-part tariff supplementary charge
   * (that relates to the actual abstraction)
   * @return {Boolean}
   */
  get isTwoPartTariffSupplementaryCharge () {
    return this._isTwoPartTariffSupplementaryCharge;
  }

  set isTwoPartTariffSupplementaryCharge (isTwoPartTariffSupplementaryCharge) {
    assertIsBoolean(isTwoPartTariffSupplementaryCharge);
    this._isTwoPartTariffSupplementaryCharge = isTwoPartTariffSupplementaryCharge;
  }

  /**
   * Gets the transaction line description
   * As sent to the Charge Module
   * @return {String}
   */
  get description () {
    return this._description;
  }

  set description (description) {
    assertString(description);
    return this._description;
  }

  /**
   * Gets source
   * @return {String}
   */
  get source () {
    return this._source;
  }

  set source (source) {
    assertEnum(source, Object.values(sources));
    this._source = source;
  }

  /**
   * Gets season
   * @return {String}
   */
  get season () {
    return this._season;
  }

  set season (season) {
    assertEnum(season, Object.values(seasons));
    this._season = season;
  }

  /**
   * Gets loss
   * @return {String}
   */
  get loss () {
    return this._loss;
  }

  set loss (loss) {
    assertEnum(loss, Object.values(losses));
    this._loss = loss;
  }
}

module.exports = Transaction;
