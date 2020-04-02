'use strict';

const Model = require('./model');
const AbstractionPeriod = require('./abstraction-period');
const Purpose = require('./purpose');
const { CHARGE_SEASON } = require('./constants');

const {
  assertEnum,
  assertIsInstanceOf,
  assertQuantity,
  assertNullableQuantity
} = require('./validators');

const validSources = {
  supported: 'supported',
  unsupported: 'unsupported',
  tidal: 'tidal',
  kielder: 'kielder'
};

const validLosses = {
  high: 'high',
  medium: 'medium',
  low: 'low',
  veryLow: 'very low',
  nonChargeable: 'non-chargeable'
};

class ChargeElement extends Model {
  /**
   * Source
   * @return {String}
   */
  get source () {
    return this._source;
  }

  set source (source) {
    assertEnum(source, Object.values(validSources));
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
    assertEnum(season, Object.values(CHARGE_SEASON));
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
    assertEnum(loss, Object.values(validLosses));
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
    assertIsInstanceOf(abstractionPeriod, AbstractionPeriod);
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
    assertQuantity(quantity);
    this._authorisedAnnualQuantity = quantity;
  }

  /**
   * Billable annual quantity - Ml
   * @return {Number}
   */
  get billableAnnualQuantity () {
    return this._billableAnnualQuantity;
  }

  set billableAnnualQuantity (quantity) {
    assertNullableQuantity(quantity);
    this._billableAnnualQuantity = quantity;
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
   * An instance of Purpose for the tertiary/use purpose
   * @param {Purpose}
   */
  set purposeUse (purpose) {
    assertIsInstanceOf(purpose, Purpose);
    this._purposeUse = purpose;
  }

  get purposeUse () {
    return this._purposeUse;
  }

  toJSON () {
    return {
      ...super.toJSON(),
      eiucSource: this.eiucSource
    };
  }
}

module.exports = ChargeElement;
module.exports.sources = validSources;
module.exports.losses = validLosses;
