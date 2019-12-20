'use strict';

const Model = require('./model');
const { assertPositiveInteger } = require('./validators');

class Agreement extends Model {
  get code () {
    return this._code;
  }

  set code (code) {
    assertPositiveInteger(code);
    this._code = code;
  }
}

module.exports = Agreement;
