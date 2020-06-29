'use strict';

const Model = require('./model');

const {
  assertEnum,
  assertString
} = require('./validators');

const PURPOSE_TYPES = {
  primary: 'primary',
  secondary: 'secondary',
  use: 'use'
};

const SPRAY_IRRIGATION_PURPOSE_CODES = [380, 400, 410, 420];
const TRICKLE_IRRIGATION_PURPOSE_CODES = [600, 620];

const TWO_PART_TARIFF_PURPOSE_CODES = [...SPRAY_IRRIGATION_PURPOSE_CODES, ...TRICKLE_IRRIGATION_PURPOSE_CODES];

class Purpose extends Model {
  get type () {
    return this._type;
  }

  set type (type) {
    assertEnum(type, Object.values(PURPOSE_TYPES));
    this._type = type;
  }

  /**
   * Human-readable name, e.g. 'North West'
   * @return {String}
   */
  get name () {
    return this._name;
  }

  set name (name) {
    assertString(name);
    this._name = name;
  }

  /**
   * Alphanumeric code
   * @return {String}
   */
  get code () {
    return this._code;
  }

  set code (code) {
    assertString(code);
    this._code = code;
  }
}

module.exports = Purpose;
module.exports.PURPOSE_TYPES = PURPOSE_TYPES;
module.exports.TWO_PART_TARIFF_PURPOSE_CODES = TWO_PART_TARIFF_PURPOSE_CODES;
