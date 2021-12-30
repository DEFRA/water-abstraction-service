'use strict';

const { isNull, max } = require('lodash');

const Model = require('./model');
const AbstractionPeriod = require('./abstraction-period');
const DateRange = require('./date-range');
const Purpose = require('./purpose');
const PurposeUse = require('./purpose-use');
const ChargePurpose = require('./charge-purpose');
const ChargeCategory = require('./charge-category');
const { CHARGE_SEASON, LOSSES } = require('./constants');

const validators = require('./validators');

const validSources = {
  supported: 'supported',
  unsupported: 'unsupported',
  tidal: 'tidal',
  kielder: 'kielder',
  nonTidal: 'non-tidal'
};

const WATER_AVAILABILITY = {
  available: 'available',
  restricted: 'restricted availablity or no availability'
};

const WATER_MODEL = {
  noModel: 'no model',
  tier1: 'tier 1',
  tier2: 'tier 2'
};

const SCHEME = {
  alcs: 'alcs',
  sroc: 'sroc'
};

class ChargeElement extends Model {
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
    validators.assertEnum(source, Object.values(validSources));
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
    validators.assertIsEmpty(this._volume);
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
    validators.assertIsEmpty(this._volume);
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
   * Gets billing volume to use
   * This could should be null when authorised quantity is not null
   * @return {Number}
   */
  get volume () {
    return isNull(this._volume)
      ? this._billableAnnualQuantity || this._authorisedAnnualQuantity
      : this._volume;
  }

  /**
   * For SROC volume is set only when billable and
   * authorised quantities are empty i.e.
   * undefined, '' or null
   * authorised quantity cannot be null so should be undefined
   * @return {Number}
   */
  set volume (volume) {
    validators.assertIsEmpty(this._billableAnnualQuantity);
    validators.assertIsEmpty(this._authorisedAnnualQuantity);
    validators.assertQuantity(volume);
    this._volume = parseFloat(volume);
  }

  /**
   * Primary purpose
   * @param {Purpose}
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
   * @param {Purpose}
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
   * @param {PurposeUse}
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
  * @param {dateRange}
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

  get chargeVersionId () { return this._chargeVersionId; }
  set chargeVersionId (chargeVersionId) {
    validators.assertId(chargeVersionId);
    this._chargeVersionId = chargeVersionId;
  }

  get isFactorsOverridden () { return this._isFactorsOverridden; }
  set isFactorsOverridden (isFactorsOverridden) {
    validators.assertIsBoolean(isFactorsOverridden);
    this._isFactorsOverridden = isFactorsOverridden;
  }

  /**
   * Default value is true, which means a licence-level S127 agreement applies to this
   * element.  This flag can be set to false, which enables the S127 agreement to be
   * removed from this element.
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

  get chargePurposes () {
    return this._chargePurposes;
  }

  /**
   * Charge purposes
   * @param {Array<ChargePurpose>}
   */
  set chargePurposes (chargePurposes) {
    validators.assertIsArrayOfType(chargePurposes, ChargePurpose);
    this._chargePurposes = chargePurposes;
  }

  get waterAvailability () {
    return this._waterAvailability;
  }

  set waterAvailability (waterAvailability) {
    validators.assertEnum(waterAvailability, Object.values(WATER_AVAILABILITY));
    this._waterAvailability = waterAvailability;
  }

  get waterModel () {
    return this._waterModel;
  }

  set waterModel (waterModel) {
    validators.assertEnum(waterModel, Object.values(WATER_MODEL));
    this._waterModel = waterModel;
  }

  get scheme () {
    return this._scheme;
  }

  /**
   * Scheme - ALCS/SROC
   * @param {String}
   */
  set scheme (scheme) {
    validators.assertEnum(scheme, Object.values(SCHEME));
    this._scheme = scheme;
  }

  get chargeCategory () {
    return this._chargeCategory;
  }

  /**
   * chargeCategory
   * @param {ChargeCategory}
   */
  set chargeCategory (chargeCategory) {
    validators.assertIsInstanceOf(chargeCategory, ChargeCategory);
    this._chargeCategory = chargeCategory;
  }

  toJSON () {
    return {
      ...super.toJSON(),
      eiucSource: this.eiucSource,
      maxAnnualQuantity: this.maxAnnualQuantity
    };
  }
}

module.exports = ChargeElement;
module.exports.sources = validSources;
