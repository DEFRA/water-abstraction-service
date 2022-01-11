'use strict';

const { isNull, max } = require('lodash');

const Model = require('./model');
const AbstractionPeriod = require('./abstraction-period');
const DateRange = require('./date-range');
const Purpose = require('./purpose');
const PurposeUse = require('./purpose-use');
const { CHARGE_SEASON, LOSSES, VALID_SOURCES } = require('./constants');

const validators = require('./validators');

class ChargePurpose extends Model {
  constructor (...args) {
    super(...args);
    this.isSection127AgreementEnabled = true;
  }

  /**
   * Source
   * @return {String}
   */
  get source () {
    return this._source;
  }

  set source (source) {
    validators.assertEnum(source, Object.values(VALID_SOURCES));
    this._source = source;
  }

  /**
   * EIUC source is derived from source
   * and is either tidal|other
   * @return {String}
   */
  get eiucSource () {
    return this._source === 'tidal' ? 'tidal' : 'other';
  }

  /**
   * Season
   * @return {String}
   */
  get season () {
    return this._season;
  }

  set season (season) {
    validators.assertEnum(season, Object.values(CHARGE_SEASON));
    this._season = season;
  }

  /**
   * Loss
   * @return {String}
   */
  get loss () {
    return this._loss;
  }

  set loss (loss) {
    validators.assertEnum(loss, Object.values(LOSSES));
    this._loss = loss;
  }

  /**
   * Abstraction period
   * @return {AbstractionPeriod}
   */
  get abstractionPeriod () {
    return this._abstractionPeriod;
  }

  set abstractionPeriod (abstractionPeriod) {
    validators.assertIsInstanceOf(abstractionPeriod, AbstractionPeriod);
    this._abstractionPeriod = abstractionPeriod;
  }

  /**
   * Authorised annual quantity - Ml
   * @return {Number}
   */
  get authorisedAnnualQuantity () {
    return this._authorisedAnnualQuantity;
  }

  set authorisedAnnualQuantity (quantity) {
    validators.assertQuantity(quantity);
    this._authorisedAnnualQuantity = parseFloat(quantity);
  }

  /**
   * Billable annual quantity - Ml
   * @return {Number}
   */
  get billableAnnualQuantity () {
    return this._billableAnnualQuantity;
  }

  set billableAnnualQuantity (quantity) {
    validators.assertNullableQuantity(quantity);
    this._billableAnnualQuantity = isNull(quantity) ? null : parseFloat(quantity);
  }

  /**
   * Gets the maximum allowable annual quantity
   * @return {Number}
   */
  get maxAnnualQuantity () {
    return max([this.billableAnnualQuantity, this.authorisedAnnualQuantity]);
  }

  /**
   * Gets billing quantity to use
   * This could be auth, billable or actual quantity
   * @return {Number}
   */
  get volume () {
    return this._billableAnnualQuantity || this._authorisedAnnualQuantity;
  }

  /**
   * Primary purpose
   * @param {Purpose} purposePrimary
   */
  set purposePrimary (purposePrimary) {
    validators.assertIsInstanceOf(purposePrimary, Purpose);
    this._purposePrimary = purposePrimary;
  }

  get purposePrimary () {
    return this._purposePrimary;
  }

  /**
   * Secondary purpose
   * @param {Purpose} purposeSecondary
   */
  set purposeSecondary (purposeSecondary) {
    validators.assertIsInstanceOf(purposeSecondary, Purpose);
    this._purposeSecondary = purposeSecondary;
  }

  get purposeSecondary () {
    return this._purposeSecondary;
  }

  /**
   * An instance of PurposeUse for the tertiary/use purpose
   * @param {PurposeUse} purposeUse
   */
  set purposeUse (purposeUse) {
    validators.assertIsInstanceOf(purposeUse, PurposeUse);
    this._purposeUse = purposeUse;
  }

  get purposeUse () {
    return this._purposeUse;
  }

  /**
  * An instance of Date Range containing the time limited start
  * and end dates, only exists if both dates exist
  * @param {dateRange} dateRange
  */
  set timeLimitedPeriod (dateRange) {
    validators.assertIsNullableInstanceOf(dateRange, DateRange);
    this._timeLimitedPeriod = dateRange;
  }

  get timeLimitedPeriod () {
    return this._timeLimitedPeriod;
  }

  get description () { return this._description; }
  set description (description) {
    validators.assertNullableString(description);
    this._description = description;
  }

  get chargeElementId () { return this._chargeElementId; }
  set chargeElementId (chargeElementId) {
    validators.assertId(chargeElementId);
    this._chargeElementId = chargeElementId;
  }

  get isFactorsOverridden () { return this._isFactorsOverridden; }
  set isFactorsOverridden (isFactorsOverridden) {
    validators.assertIsBoolean(isFactorsOverridden);
    this._isFactorsOverridden = isFactorsOverridden;
  }

  /**
   * Default value is true, which means a licence-level S127 agreement applies to this
   * purpose.  This flag can be set to false, which enables the S127 agreement to be
   * removed from this purpose.
   *
   * @returns {Boolean}
   */
  get isSection127AgreementEnabled () {
    return this._isSection127AgreementEnabled;
  }

  set isSection127AgreementEnabled (isSection127AgreementEnabled) {
    validators.assertIsBoolean(isSection127AgreementEnabled);
    this._isSection127AgreementEnabled = isSection127AgreementEnabled;
  }

  toJSON () {
    return {
      ...super.toJSON(),
      eiucSource: this.eiucSource,
      maxAnnualQuantity: this.maxAnnualQuantity
    };
  }
}

module.exports = ChargePurpose;
module.exports.sources = VALID_SOURCES;
