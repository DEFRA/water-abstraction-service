'use strict'

const { isNull, max } = require('lodash')

const Model = require('./model')
const AbstractionPeriod = require('./abstraction-period')
const DateRange = require('./date-range')
const Purpose = require('./purpose')
const PurposeUse = require('./purpose-use')
const ChargePurpose = require('./charge-purpose')
const ChargeCategory = require('./charge-category')
const { CHARGE_SEASON, LOSSES, VALID_SOURCES, SCHEME, WATER_MODEL } = require('./constants')
const validators = require('./validators')

class ChargeElement extends Model {
  constructor (...args) {
    super(...args)
    this.isSection127AgreementEnabled = true
    this._scheme = SCHEME.alcs
  }

  /**
   * Source
   * @return {String}
   */
  get source () {
    return this._source
  }

  set source (source) {
    validators.assertNullableEnum(source, Object.values(VALID_SOURCES))
    this._source = source
  }

  /**
   * EIUC source is derived from source
   * and is either tidal|other
   * @return {String}
   */
  get eiucSource () {
    return this._source === 'tidal' ? 'tidal' : 'other'
  }

  get eiucRegion () {
    return this._eiucRegion
  }

  set eiucRegion (eiucRegion) {
    validators.assertNullableString(eiucRegion)
    this._eiucRegion = eiucRegion || null
  }

  /**
   * Season
   * @return {String}
   */
  get season () {
    return this._season
  }

  set season (season) {
    validators.assertNullableEnum(season, Object.values(CHARGE_SEASON))
    this._season = season
  }

  /**
   * Loss
   * @return {String}
   */
  get loss () {
    return this._loss
  }

  set loss (loss) {
    validators.assertEnum(loss, Object.values(LOSSES))
    this._loss = loss
  }

  /**
   * Abstraction period
   * @return {AbstractionPeriod}
   */
  get abstractionPeriod () {
    return this._abstractionPeriod
  }

  set abstractionPeriod (abstractionPeriod) {
    abstractionPeriod
      ? validators.assertIsInstanceOf(abstractionPeriod, AbstractionPeriod)
      : validators.assertIsEmpty(abstractionPeriod)
    this._abstractionPeriod = abstractionPeriod
  }

  /**
   * Authorised annual quantity - Ml
   * @return {Number}
   */
  get authorisedAnnualQuantity () {
    return this._authorisedAnnualQuantity
  }

  set authorisedAnnualQuantity (quantity) {
    validators.assertNullableQuantity(quantity)
    this._authorisedAnnualQuantity = parseFloat(quantity)
  }

  /**
   * Billable annual quantity - Ml
   * @return {Number}
   */
  get billableAnnualQuantity () {
    return this._billableAnnualQuantity
  }

  set billableAnnualQuantity (quantity) {
    validators.assertNullableQuantity(quantity)
    this._billableAnnualQuantity = isNull(quantity) ? null : parseFloat(quantity)
  }

  /**
   * Gets the maximum allowable annual quantity
   * @return {Number}
   */
  get maxAnnualQuantity () {
    return max([this.billableAnnualQuantity, this.authorisedAnnualQuantity])
  }

  /**
   * Gets billing volume to use
   * This could should be null when authorised quantity is not null
   * @return {Number}
   */
  get volume () {
    return this._scheme === SCHEME.sroc
      ? this._volume
      : this._billableAnnualQuantity || this._authorisedAnnualQuantity
  }

  /**
   * For SROC volume is set only when billable and
   * authorised quantities are empty i.e.
   * undefined, '' or null
   * authorised quantity cannot be null so should be undefined
   * @return {Number}
   */
  set volume (volume) {
    validators.assertNullableQuantity(volume)
    this._volume = parseFloat(volume)
  }

  /**
   * Primary purpose
   * @param {Purpose} purposePrimary
   */
  set purposePrimary (purposePrimary) {
    validators.assertIsInstanceOf(purposePrimary, Purpose)
    this._purposePrimary = purposePrimary
  }

  get purposePrimary () {
    return this._purposePrimary
  }

  /**
   * Secondary purpose
   * @param {Purpose} purposeSecondary
   */
  set purposeSecondary (purposeSecondary) {
    validators.assertIsInstanceOf(purposeSecondary, Purpose)
    this._purposeSecondary = purposeSecondary
  }

  get purposeSecondary () {
    return this._purposeSecondary
  }

  /**
   * An instance of PurposeUse for the tertiary/use purpose
   * @param {PurposeUse} purposeUse
   */
  set purposeUse (purposeUse) {
    validators.assertIsInstanceOf(purposeUse, PurposeUse)
    this._purposeUse = purposeUse
  }

  get purposeUse () {
    return this._purposeUse
  }

  /**
  * An instance of Date Range containing the time limited start
  * and end dates, only exists if both dates exist
  * @param {dateRange} dateRange
  */
  set timeLimitedPeriod (dateRange) {
    validators.assertIsNullableInstanceOf(dateRange, DateRange)
    this._timeLimitedPeriod = dateRange
  }

  get timeLimitedPeriod () {
    return this._timeLimitedPeriod
  }

  get description () { return this._description }
  set description (description) {
    validators.assertNullableString(description)
    this._description = description
  }

  get chargeVersionId () { return this._chargeVersionId }
  set chargeVersionId (chargeVersionId) {
    validators.assertId(chargeVersionId)
    this._chargeVersionId = chargeVersionId
  }

  get isFactorsOverridden () { return this._isFactorsOverridden }
  set isFactorsOverridden (isFactorsOverridden) {
    validators.assertIsNullableBoolean(isFactorsOverridden)
    this._isFactorsOverridden = isFactorsOverridden
  }

  /**
   * Default value is true, which means a licence-level S127 agreement applies to this
   * element.  This flag can be set to false, which enables the S127 agreement to be
   * removed from this element.
   *
   * @returns {Boolean}
   */
  get isSection127AgreementEnabled () {
    return this._isSection127AgreementEnabled
  }

  set isSection127AgreementEnabled (isSection127AgreementEnabled) {
    validators.assertIsBoolean(isSection127AgreementEnabled)
    this._isSection127AgreementEnabled = isSection127AgreementEnabled
  }

  get chargePurposes () {
    return this._chargePurposes
  }

  /**
   * Charge purposes
   * @param {Array<ChargePurpose>} chargePurposes
   */
  set chargePurposes (chargePurposes) {
    validators.assertIsArrayOfType(chargePurposes, ChargePurpose)
    this._chargePurposes = chargePurposes
  }

  get isRestrictedSource () {
    return this._isRestrictedSource
  }

  set isRestrictedSource (isRestrictedSource) {
    validators.assertIsBoolean(isRestrictedSource)
    this._isRestrictedSource = isRestrictedSource
  }

  get waterModel () {
    return this._waterModel
  }

  set waterModel (waterModel) {
    validators.assertNullableEnum(waterModel, Object.values(WATER_MODEL))
    this._waterModel = waterModel
  }

  get scheme () {
    return this._scheme
  }

  /**
   * Scheme - ALCS/SROC
   * @param {String} scheme
   */
  set scheme (scheme) {
    validators.assertEnum(scheme, Object.values(SCHEME))
    this._scheme = scheme
  }

  get chargeCategory () {
    return this._chargeCategory
  }

  /**
   * chargeCategory
   * @param {ChargeCategory} chargeCategory
   */
  set chargeCategory (chargeCategory) {
    validators.assertIsNullableInstanceOf(chargeCategory, ChargeCategory)
    this._chargeCategory = chargeCategory
  }

  toJSON () {
    return {
      ...super.toJSON(),
      eiucSource: this.eiucSource,
      maxAnnualQuantity: this.maxAnnualQuantity
    }
  }
}

module.exports = ChargeElement
module.exports.sources = VALID_SOURCES
