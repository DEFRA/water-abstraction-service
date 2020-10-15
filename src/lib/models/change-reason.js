'use strict';

const Model = require('./model');
const validators = require('./validators');

const changeReasonTypes = [
  'new_chargeable_charge_version',
  'new_non_chargeable_charge_version'
];

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

  get type () {
    return this._type;
  }

  set type (type) {
    validators.assertEnum(type, changeReasonTypes);
    this._type = type;
  }
}

module.exports = ChangeReason;
module.exports.changeReasonTypes = changeReasonTypes;
