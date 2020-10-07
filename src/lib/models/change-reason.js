'use strict';

const Model = require('./model');
const validators = require('./validators');

class ChangeReason extends Model {
  get description () {
    return this._description;
  }

  set description (description) {
    validators.assertString(description);
    this._description = description;
  }

  get triggersMinimumCharge () {
    return this._triggersMinimumCharge;
  }

  set triggersMinimumCharge (triggersMinimumCharge) {
    validators.assertIsBoolean(triggersMinimumCharge);
    this._triggersMinimumCharge = triggersMinimumCharge;
  }
}

module.exports = ChangeReason;
