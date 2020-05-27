'use strict';

const { titleCase } = require('title-case');

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

const twoPartTariffStatuses = {
  ERROR_NO_RETURNS_SUBMITTED: 10,
  ERROR_UNDER_QUERY: 20,
  ERROR_RECEIVED: 30,
  ERROR_SOME_RETURNS_DUE: 40,
  ERROR_LATE_RETURNS: 50,
  ERROR_OVER_ABSTRACTION: 60,
  ERROR_NO_RETURNS_FOR_MATCHING: 70
};

const getTwoPartTariffTransactionDescription = (transaction) => {
  const prefix = transaction.isTwoPartTariffSupplementary ? 'Second' : 'First';
  const { purposeUse: { name: purpose }, description } = transaction.chargeElement;

  return `${prefix} part ${purpose} charge at ${description}`;
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
   * Creates a fresh model (with no ID) from the current model, set up as
   * a credit
   * @return {Transaction}
   */
  toCredit () {
    const transaction = new Transaction();
    transaction.pickFrom(this, [
      'value', 'authorisedDays', 'billableDays', 'agreements', 'chargePeriod',
      'isCompensationCharge', 'description', 'chargeElement', 'volume'
    ]);
    transaction.fromHash({
      isCredit: true,
      status: statuses.candidate
    });
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
    validators.assertNullableQuantityWithMaximum(volume, this.chargeElement.volume);
    this._volume = volume;
  }

  /**
   * Creates a POJO containing a single layer of data that will be
   * used to create a unique hash for this transaction
   *
   * @param {InvoiceAccount} invoiceAccount The invoice account for the transaction
   * @param {Licence} licence Licence information
   * @param {Batch} batch The batch this transaction appears in
   */
  getHashData (invoiceAccount, licence, batch) {
    return {
      periodStart: this.chargePeriod.startDate,
      periodEnd: this.chargePeriod.endDate,
      ...this.pick('billableDays', 'authorisedDays', 'volume', 'description', 'isCompensationCharge'),
      agreements: this.agreements.map(ag => ag.code).sort().join('-'),
      accountNumber: invoiceAccount.accountNumber,
      ...this.chargeElement.pick('source', 'season', 'loss'),
      licenceNumber: licence.licenceNumber,
      regionCode: batch.region.code,
      isTwoPartTariff: this.isTwoPartTariffSupplementary
    };
  }

  /**
   * Sets the transactionKey values to a unique hash for this transaction
   *
   * @param {String} invoiceAccount The invoice account for the transaction
   * @param {Object} licence Licence information
   * @param {Obejct} batch The batch this transaction appears in
   */
  createTransactionKey (invoiceAccount, licence, batch) {
    const hash = this.getHashData(invoiceAccount, licence, batch);

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

  /**
   * Whether this transaction is a two-part tariff supplementary charge
   * @return {Boolean}
   */
  get isTwoPartTariffSupplementary () {
    return this._isTwoPartTariffSupplementary;
  }

  set isTwoPartTariffSupplementary (isTwoPartTariffSupplementary) {
    validators.assertIsBoolean(isTwoPartTariffSupplementary);
    this._isTwoPartTariffSupplementary = isTwoPartTariffSupplementary;
  }

  /**
   * Creates and returns the transaction description
   * @return {String}
   */
  createDescription () {
    const isTwoPartTariff = !!this.getAgreementByCode('S127');
    if (this.isCompensationCharge) {
      this._description = 'Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element';
    } else {
      const description = isTwoPartTariff
        ? getTwoPartTariffTransactionDescription(this)
        : this.chargeElement.description;

      this._description = titleCase(description || '');
    }
    return this._description;
  }
}

module.exports = Transaction;
module.exports.statuses = statuses;
module.exports.twoPartTariffStatuses = twoPartTariffStatuses;
