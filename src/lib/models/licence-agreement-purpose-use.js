'use strict';

const validators = require('./validators');

const Model = require('./model');
const PurposeUse = require('./purpose-use');

class LicenceAgreementPurposeUse extends Model {
  /**
   * An instance of PurposeUse for the tertiary/use purpose
   * @param {PurposeUse}
   */
  set purposeUse (purposeUse) {
    validators.assertIsInstanceOf(purposeUse, PurposeUse);
    this._purposeUse = purposeUse;
  }

  get purposeUse () {
    return this._purposeUse;
  }
}

module.exports = LicenceAgreementPurposeUse;
