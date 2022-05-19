'use strict'

const Model = require('./model')
const { LOSSES } = require('./constants')

const validators = require('./validators')

class PurposeUse extends Model {
  /**
   * Human-readable name, e.g. 'North West'
   * @return {String}
   */
  get name () {
    return this._name
  }

  set name (name) {
    validators.assertString(name)
    this._name = name
  }

  /**
   * Alphanumeric code
   * @return {String}
   */
  get code () {
    return this._code
  }

  set code (code) {
    validators.assertString(code)
    this._code = code
  }

  get lossFactor () { return this._lossFactor }
  set lossFactor (lossFactor) {
    validators.assertEnum(lossFactor, Object.values(LOSSES))
    this._lossFactor = lossFactor
  }

  get isTwoPartTariff () { return this._isTwoPartTariff }
  set isTwoPartTariff (isTwoPartTariff) {
    validators.assertIsBoolean(isTwoPartTariff)
    this._isTwoPartTariff = isTwoPartTariff
  }

  get dateCreated () { return this._dateCreated }
  set dateCreated (dateCreated) {
    this._dateCreated = this.getDateOrThrow(dateCreated, 'Date created')
  }

  get dateUpdated () { return this._dateUpdated }
  set dateUpdated (dateUpdated) {
    this._dateUpdated = this.getDateOrThrow(dateUpdated, 'Date updated')
  }
}

module.exports = PurposeUse
