'use strict';

const { isNull, identity } = require('lodash');
const { titleCase } = require('title-case');

const Model = require('./model');
const Agreement = require('./agreement');
const DateRange = require('./date-range');
const ChargeElement = require('./charge-element');
const BillingVolume = require('./billing-volume');

const validators = require('./validators');

/**
 * @constant {Object} statuses - transaction statuses
 *
 * "candidate": charge created in WRLS but not yet transferred to CM
 * "charge_created": successfully transferred to CM
 * "approved": not used
 * "error": error transferring charge to CM
 */
const statuses = {
  candidate: 'candidate',
  chargeCreated: 'charge_created',
  approved: 'approved',
  error: 'error'
};

const getDescriptionFromChargeElement = chargeElement => {
  return chargeElement.description || chargeElement.purposeUse.name;
};

/**
 * Removes the part of the purpose use description after the hyphen
 * For example, Spray Irrigation - Direct is mapped to Spray Irrigation
 *
 * @param {PurposeUse} purposeUse
 * @returns {String}
 */
const getPurposeUseDescription = purposeUse => {
  return purposeUse.name.split('-')[0].trim();
};

const getTwoPartTariffTransactionDescription = transaction => {
  const prefix = transaction.isTwoPartSecondPartCharge ? 'Second' : 'First';
  const purposeUseDescription = getPurposeUseDescription(transaction.chargeElement.purposeUse);
  const { description } = transaction.chargeElement;

  return [prefix, 'Part', purposeUseDescription, 'Charge', description]
    .filter(identity)
    .join(' ');
};

class Transaction extends Model {
  constructor (id, value, isCredit = false, isCreditedBack = false) {
    super(id);
    this.value = value;
    this.isCredit = isCredit;
    this._isCreditedBack = isCreditedBack;
    this._agreements = [];
    this.status = statuses.candidate;
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
    // validators.assertIsBoolean(isCredit);
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
    validators.assertDaysInYear(days);
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
    validators.assertDaysInYear(days);
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
   * Gets the purpose use code for the transaction
   * that is used for creating the transaction hash
   * @return {String}
   */
  get chargeElementPurposeUseCode () {
    return this.chargeElement.purposeUse.code;
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
    validators.assertNullableQuantity(volume);
    if (isNull(volume)) {
      this._volume = volume;
    } else {
      /* Important note
      The volume in the transactions table for historic nald
      transactions was rounded up in some cases. When trying to raise
      a credit transaction for one of these transactions it fails at the
      charge module therefore it is overriden here and set to the maximum quantity
      */
      this._volume = parseFloat(volume) > parseFloat(this.chargeElement.maxAnnualQuantity)
        ? this.chargeElement.maxAnnualQuantity
        : volume;
    }
  }

  /**
 * Gets the billing volume instance that is linked to this
 * @return {BillingVolume}
 */
  get billingVolume () {
    return this._billingVolume;
  }

  set billingVolume (billingVolume) {
    validators.assertIsNullableInstanceOf(billingVolume, BillingVolume);
    this._billingVolume = billingVolume;
  }

  /**
 * Whether it is part of the first set of transactions
 * on a new licence, determined from change reason
 * @return {Boolean}
 */
  get isNewLicence () {
    return this._isNewLicence;
  }

  set isNewLicence (isNewLicence) {
    validators.assertIsBoolean(isNewLicence);
    this._isNewLicence = isNewLicence;
  }

  /**
  * Whether this is a minimum charge transaction
  * i.e. the amount to bring the total to the minimum charge
  * Received from Charging Module
  * @return {Boolean}
  */
  get isMinimumCharge () {
    return this._isMinimumCharge;
  }

  set isMinimumCharge (isMinimumCharge) {
    validators.assertIsBoolean(isMinimumCharge);
    this._isMinimumCharge = isMinimumCharge;
  }

  get externalId () {
    return this._externalId;
  }

  set externalId (externalId) {
    validators.assertNullableId(externalId);
    this._externalId = externalId;
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
      ...this.pick('billableDays', 'authorisedDays', 'volume', 'description',
        'isCompensationCharge', 'isNewLicence'),
      agreements: this.agreements.map(ag => ag.code).sort().join('-'),
      accountNumber: invoiceAccount.accountNumber,
      ...this.chargeElement.pick('source', 'season', 'loss'),
      licenceNumber: licence.licenceNumber,
      regionCode: batch.region.code,
      isTwoPartTariff: this.isTwoPartSecondPartCharge
    };
  }

  /**
   * Whether this transaction is a two-part tariff supplementary charge
   * @return {Boolean}
   */
  get isTwoPartSecondPartCharge () {
    return this._isTwoPartSecondPartCharge;
  }

  set isTwoPartSecondPartCharge (isTwoPartSecondPartCharge) {
    validators.assertIsBoolean(isTwoPartSecondPartCharge);
    this._isTwoPartSecondPartCharge = isTwoPartSecondPartCharge;
  }

  /**
   * Creates, sets and returns the transaction description
   * @return {String}
   */
  createDescription () {
    if (this.isCompensationCharge) {
      this.description = 'Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element';
      return this.description;
    }

    const isTwoPartTariff = !!this.getAgreementByCode('S127');
    const description = isTwoPartTariff
      ? getTwoPartTariffTransactionDescription(this)
      : getDescriptionFromChargeElement(this.chargeElement);

    this.description = titleCase(description);
    return this.description;
  }

  /**
   * Whether de-minimis rules is applied
   * This occurs when invoice/credit note value < £5
   * @param {Boolean}
   */
  set isDeMinimis (isDeMinimis) {
    validators.assertIsBoolean(isDeMinimis);
    this._isDeMinimis = isDeMinimis;
  }

  get isDeMinimis () {
    return this._isDeMinimis;
  }

  set calcSourceFactor (calcSourceFactor) {
    validators.assertNullableNumeric(calcSourceFactor);
    this._calcSourceFactor = calcSourceFactor;
  }

  get calcSourceFactor () {
    return this._calcSourceFactor;
  }

  set calcSeasonFactor (calcSeasonFactor) {
    validators.assertNullableNumeric(calcSeasonFactor);
    this._calcSeasonFactor = calcSeasonFactor;
  }

  get calcSeasonFactor () {
    return this._calcSeasonFactor;
  }

  set calcLossFactor (calcLossFactor) {
    validators.assertNullableNumeric(calcLossFactor);
    this._calcLossFactor = calcLossFactor;
  }

  get calcLossFactor () {
    return this._calcLossFactor;
  }

  set calcSucFactor (calcSucFactor) {
    validators.assertNullableNumeric(calcSucFactor);
    this._calcSucFactor = calcSucFactor;
  }

  get calcSucFactor () {
    return this._calcSucFactor;
  }

  set calcS126Factor (calcS126Factor) {
    validators.assertNullableFactorWithPrefix(calcS126Factor);
    this._calcS126Factor = calcS126Factor;
  }

  get calcS126Factor () {
    return this._calcS126Factor;
  }

  set calcS127Factor (calcS127Factor) {
    validators.assertNullableFactorWithPrefix(calcS127Factor);
    this._calcS127Factor = calcS127Factor;
  }

  get calcS127Factor () {
    return this._calcS127Factor;
  }

  set calcEiucFactor (calcEiucFactor) {
    validators.assertNullableNumeric(calcEiucFactor);
    this._calcEiucFactor = calcEiucFactor;
  }

  get calcEiucFactor () {
    return this._calcEiucFactor;
  }

  set calcEiucSourceFactor (calcEiucSourceFactor) {
    validators.assertNullableNumeric(calcEiucSourceFactor);
    this._calcEiucSourceFactor = calcEiucSourceFactor;
  }

  get calcEiucSourceFactor () {
    return this._calcEiucSourceFactor;
  }

  /**
   * Checks if the transaction is in error status
   * @return {Boolean}
   */
  get isErrorStatus () {
    return this.status === statuses.error;
  }

  /**
   * If true the transaction has been
   * reversed/credited in a previous bill run
   * @param {Boolean}
   */
  set isCreditedBack (value) {
    validators.assertIsBoolean(value);
    this._isCreditedBack = value;
  }

  get isCreditedBack () {
    return this._isCreditedBack;
  }

  set isWaterCompanyCharge (value) {
    validators.assertIsBoolean(value);
    this._isWaterCompanyCharge = value;
  }

  get isWaterCompanyCharge () {
    return this._isWaterCompanyCharge;
  }
}

module.exports = Transaction;
module.exports.statuses = statuses;
