'use strict';

const Model = require('./model');
const { assertAgreementCode } = require('./validators');

class Agreement extends Model {
  get code () {
    return this._code;
  }

  set code (code) {
    assertAgreementCode(code);
    this._code = code;
  }
}

module.exports = Agreement;
