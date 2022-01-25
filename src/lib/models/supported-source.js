'use strict';

const validators = require('./validators');

const Model = require('./model');

class SupportedSource extends Model {
  get supportedSourceId () {
    return this._supportedSourceId;
  }

  set supportedSourceId (supportedSourceId) {
    validators.assertId(supportedSourceId);
    this._supportedSourceId = supportedSourceId;
  }

  get reference () {
    return this._reference;
  }

  set reference (reference) {
    validators.assertString(reference);
    this._reference = reference;
  }

  get name () {
    return this._name;
  }

  set name (name) {
    validators.assertStringWithLengthLimit(name, 255);
    this._name = name;
  }

  get order () {
    return this._order;
  }

  set order (order) {
    validators.assertNullablePositiveOrZeroInteger(order);
    this._order = order;
  }

  get region () {
    return this._region;
  }

  set region (region) {
    validators.assertNullableStringWithLengthLimit(region, 255);
    this._region = region;
  }
}

module.exports = SupportedSource;
