'use strict';

const Model = require('./model');
const PurposeUse = require('./purpose-use');

const validators = require('./validators');

/**
 * A model to represent the requirement to complete a return
 * @class
 */
class ReturnRequirementPurpose extends Model {
  /**
   * Array of purpose uses for this return requirement
   * @param {Array<PurposeUse>}
   */
  set purposeUse (purposeUse) {
    validators.assertIsInstanceOf(purposeUse, PurposeUse);
    this._purposeUse = purposeUse;
  }

  get purposeUse () {
    return this._purposeUse;
  }
}

module.exports = ReturnRequirementPurpose;
