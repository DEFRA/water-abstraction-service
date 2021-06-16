'use strict';
const LicenceVersion = require('./licence-version');
const Model = require('./model');

const { assertIsInstanceOf } = require('./validators');

class LicenceVersionPurposeCondition extends Model {
  /**
   * Sets the licence instance
   * @param {LicenceVersion} licenceVersion
   */
  set licenceVersion (licenceVersion) {
    assertIsInstanceOf(licenceVersion, LicenceVersion);
    this._licenceVersion = licenceVersion;
  }

  /**
   * Gets the licence instance
   * @return {LicenceVersion}
   */
  get licenceVersion () {
    return this._licenceVersion;
  }

  get param1 () {
    return this._param1;
  }

  set param1 (param1) {
    this._param1 = param1;
  }
}

module.exports = LicenceVersionPurposeCondition;
