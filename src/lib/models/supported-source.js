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

  get listOrder () {
    return this._listOrder;
  }

  set listOrder (listOrder) {
    validators.assertNullablePositiveOrZeroInteger(listOrder);
    this._listOrder = listOrder;
  }

  get regionTag () {
    return this._name;
  }

  set regionTag (regionTag) {
    validators.assertStringWithLengthLimit(regionTag, 255);
    this._regionTag = regionTag;
  }

  get name () {
    return this._name;
  }

  set name (name) {
    validators.assertStringWithLengthLimit(name, 255);
    this._name = name;
  }
}

module.exports = SupportedSource;
