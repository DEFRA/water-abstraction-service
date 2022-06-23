'use strict'

const Model = require('./model')
const ReturnRequirementPurpose = require('./return-requirement-purpose')

const validators = require('./validators')

/**
 * A model to represent the requirement to complete a return
 * @class
 */
class ReturnRequirement extends Model {
  /**
   * @constructor
   * @param {String} id
   */
  constructor (id) {
    super(id)
    this.returnRequirementPurposes = []
  }

  /**
   * Whether the return should be completed in the summer
   * or winter/all year cycle
   * @param {Boolean} isSummer - true for summer cycle
   */
  set isSummer (isSummer) {
    validators.assertIsBoolean(isSummer)
    this._isSummer = isSummer
  }

  get isSummer () {
    return this._isSummer
  }

  /**
   * Array of purpose uses for this return requirement
   * @param {Array<PurposeUse>}
   */
  set returnRequirementPurposes (returnRequirementPurposes) {
    validators.assertIsArrayOfType(returnRequirementPurposes, ReturnRequirementPurpose)
    this._returnRequirementPurposes = returnRequirementPurposes
  }

  get returnRequirementPurposes () {
    return this._returnRequirementPurposes
  }

  /**
   * True if any of the purposes on this return are two-part tariff applicable
   * @return {Boolean}
   */
  get isTwoPartTariffPurposeUse () {
    return this.returnRequirementPurposes.some(
      returnRequirementPurpose => returnRequirementPurpose.purposeUse.isTwoPartTariff
    )
  }

  /**
   * External ID format naldRegionCode:naldReturnFormatId
   * @param {String|Null} externalId
   */
  set externalId (externalId) {
    validators.assertNullableString(externalId)
    this._externalId = externalId
  }

  get externalId () {
    return this._externalId
  }

  /**
   * Legacy ID (NALD return reference)
   * @param {Number}
   */
  set legacyId (legacyId) {
    validators.assertNullablePositiveInteger(legacyId)
    this._legacyId = legacyId
  }

  get legacyId () {
    return this._legacyId
  }
}

module.exports = ReturnRequirement
