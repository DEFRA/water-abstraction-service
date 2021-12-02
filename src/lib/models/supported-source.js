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
}

module.exports = SupportedSource;