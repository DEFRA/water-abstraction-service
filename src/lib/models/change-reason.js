'use strict';

const Model = require('./model');
const validators = require('./validators');

class ChangeReason extends Model {
  get reason () {
    return this._reason;
  }

  set reason (reason) {
    validators.assertString(reason);
    this._reason = reason;
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
