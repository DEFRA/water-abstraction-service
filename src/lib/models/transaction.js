'use strict';

const { pick } = require('lodash');
const hashers = require('../../lib/hash');

const Model = require('./model');
const Agreement = require('./agreement');
const DateRange = require('./date-range');
const ChargeElement = require('./charge-element');

const validators = require('./validators');

const statuses = {
  candidate: 'candidate',
  chargeCreated: 'charge_created',
  approved: 'approved',
  error: 'error'
};

class Transaction extends Model {
  constructor (id, value, isCredit = false) {
    super(id);
    this.value = value;
    this.isCredit = isCredit;
    this._agreements = [];
    this.status = statuses.candidate;
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
    validators.assertIsBoolean(isCredit);
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
    validators.assertAuthorisedDays(days);
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
    validators.assertBillableDays(days);
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
    validators.assertIsArrayOfType(agreements, Agreement);
    this._agreements = agreements;
  }

  /**
   * Returns the first Agreement with the given code (if exists)
   * @param {String} code
   * @return {Agreement}
   */
  getAgreementByCode (code) {
    return this._agreements.find(agreement => agreement.code === code);
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
    validators.assertIsInstanceOf(dateRange, DateRange);
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
    validators.assertIsBoolean(isCompensationCharge);
    this._isCompensationCharge = isCompensationCharge;
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
    validators.assertString(description);
    this._description = description;
  }

  /**
   * Gets the charge element instance that created this transaction
   * @return {ChargeElement}
   */
  get chargeElement () {
    return this._chargeElement;
  }

  set chargeElement (chargeElement) {
    validators.assertIsInstanceOf(chargeElement, ChargeElement);
    this._chargeElement = chargeElement;
  }

  get status () {
    return this._status;
  }

  set status (status) {
    validators.assertEnum(status, Object.values(statuses));
    this._status = status;
  }

  /**
   * The authorised/billable/actual volume for billing
   * @return {Number}
   */
  get volume () {
    return this._volume;
  }

  set volume (volume) {
    validators.assertQuantity(volume);
    this._volume = volume;
  }

  /**
   * Creates a POJO containing a single layer of data that will be
   * used to create a unique hash for this transaction
   *
   * @param {String} accountNumber The account number
   * @param {Licence} licence Licence information
   * @param {Region} region Region object
   */
  getHashData (accountNumber, licence) {
    return {
      periodStart: this.chargePeriod.startDate,
      periodEnd: this.chargePeriod.endDate,
      billableDays: this.billableDays,
      authorisedDays: this.authorisedDays,
      volume: this.volume,
      agreements: this.agreements.map(ag => ag.code).sort().join('-'),
      accountNumber,
      source: this.chargeElement.source,
      season: this.chargeElement.season,
      loss: this.chargeElement.loss,
      description: this.description,
      licenceNumber: licence.licenceNumber,
      regionCode: licence.region.code
    };
  }

  /**
   * Sets the transactionKey values to a unique hash for this transaction
   *
   * @param {String} accountNumber The account number
   * @param {Object} licence Licence information
   * @param {Obejct} region Region object
   */
  createTransactionKey (accountNumber, licence) {
    const hash = this.getHashData(accountNumber, licence);
    const hashInput = Object.entries(hash)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => `${entry[0]}:${entry[1]}`)
      .join(',');

    this.transactionKey = hashers.createMd5Hash(hashInput);
    return this.transactionKey;
  }

  get transactionKey () { return this._transactionKey; }

  set transactionKey (transactionKey) {
    validators.assertTransactionKey(transactionKey);
    this._transactionKey = transactionKey;
  }
}

module.exports = Transaction;
module.exports.statuses = statuses;
