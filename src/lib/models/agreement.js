'use strict';

const Model = require('./model');
const { assertAgreementCode, assertFactor } = require('./validators');

class Agreement extends Model {
  get code () {
    return this._code;
  }

  set code (code) {
    assertAgreementCode(code);
    this._code = code;
  }

  /**
   * Multiplication factor 0-1.
   * 1 is normal cost, 0 is 100% discount
   * @return {Number}
   */
  get factor () {
    return this._factor;
  }

  set factor (factor) {
    assertFactor(factor);
    this._factor = factor;
  }
}

module.exports = Agreement;
