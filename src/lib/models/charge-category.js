'use strict';

const validators = require('./validators');

const Model = require('./model');

class ChargeCategory extends Model {
  get chargeCategoryId () {
    return this._chargeCategoryId;
  }

  set chargeCategoryId (chargeCategoryId) {
    validators.assertId(chargeCategoryId);
    this._chargeCategoryId = chargeCategoryId;
  }

  get reference () {
    return this._reference;
  }

  set reference (reference) {
    validators.assertString(reference);
    this._reference = reference;
  }

  get subsistenceCharge () {
    return this._subsistenceCharge;
  }

  set subsistenceCharge (subsistenceCharge) {
    validators.assertInteger(subsistenceCharge);
    this._subsistenceCharge = subsistenceCharge;
  }

  get description () {
    return this._description;
  }

  set description (description) {
    validators.assertString(description);
    this._description = description;
  }

  get shortDescription () {
    return this._shortDescription;
  }

  set shortDescription (shortDescription) {
    validators.assertStringWithLengthLimit(shortDescription, 150);
    this._shortDescription = shortDescription;
  }
}

module.exports = ChargeCategory;
