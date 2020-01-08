'use strict';
const Model = require('./model');
const AbstractionPeriod = require('./abstraction-period');
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

const validSeasons = {
  summer: 'summer',
  winter: 'winter',
  allYear: 'all year'
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
   * Season
   * @return {String}
   */
  get season () {
    return this._season;
  }

  set season (season) {
    assertEnum(season, Object.values(validSeasons));
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
}

module.exports = ChargeElement;
module.exports.sources = validSources;
module.exports.seasons = validSeasons;
module.exports.losses = validLosses;
