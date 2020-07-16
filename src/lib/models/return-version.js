'use strict';

const Model = require('./model');
const ReturnLine = require('./return-line');

const validators = require('./validators');

class ReturnVersion extends Model {
  constructor (id) {
    super(id);
    this._returnLines = [];
  }

  /**
   * Sets return versions
   * @return {Array<ReturnVersion>}
   */
  set returnLines (returnLines) {
    validators.assertIsArrayOfType(returnLines, ReturnLine);
    this._returnLines = returnLines;
  }

  get returnLines () {
    return this._returnLines;
  }

  /**
   * Whether this return is a nil return
   * @param {Boolean}
   */
  set isNilReturn (isNilReturn) {
    validators.assertIsBoolean(isNilReturn);
    this._isNilReturn = isNilReturn;
  }

  get isNilReturn () {
    return this._isNilReturn;
  }

  /**
   * Whether this return is the current version
   * @param {Boolean}
   */
  set isCurrentVersion (isCurrentVersion) {
    validators.assertIsBoolean(isCurrentVersion);
    this._isCurrentVersion = isCurrentVersion;
  }

  get isCurrentVersion () {
    return this._isCurrentVersion;
  }
}

module.exports = ReturnVersion;
