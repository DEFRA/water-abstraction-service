'use strict'

const Model = require('./model')

const {
  assertString,
  assertPositiveInteger,
  assertEnum
} = require('./validators')

const validTypes = {
  region: 'region',
  environmentAgencyArea: 'EAAR',
  regionalChargeArea: 'regionalChargeArea'
}

/**
 * @classdesc a generic region class used to categorise a licence geographically
 */
class Region extends Model {
  /**
   * @param {String} [id] - GUID
   * @param {String} [type] - must match one of the above types
   */
  constructor (id, type) {
    super(id)
    if (type) {
      this.type = type
    }
  }

  get type () {
    return this._type
  }

  set type (type) {
    assertEnum(type, Object.values(validTypes))
    this._type = type
  }

  /**
   * Human-readable name, e.g. 'North West'
   * @return {String}
   */
  get name () {
    return this._name
  }

  set name (name) {
    assertString(name)
    this._name = name
  }

  get displayName () {
    return this._displayName
  }

  set displayName (displayName) {
    assertString(displayName)
    this._displayName = displayName
  }

  /**
   * Alphanumeric code
   * @return {String}
   */
  get code () {
    return this._code
  }

  set code (code) {
    assertString(code)
    this._code = code
  }

  /**
   * Numeric code - used for NALD FGAC_REGION_CODE
   * @return {Number}
   */
  get numericCode () {
    return this._numericCode
  }

  set numericCode (numericCode) {
    assertPositiveInteger(numericCode)
    this._numericCode = numericCode
  }
}

module.exports = Region
module.exports.types = validTypes
