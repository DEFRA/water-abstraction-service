'use strict'

const Model = require('./model')
const { assertAgreementCode, assertFactor } = require('./validators')

class Agreement extends Model {
  get code () {
    return this._code
  }

  set code (code) {
    assertAgreementCode(code)
    this._code = code
  }

  isAbatement () {
    return this.code === 'S126'
  }

  isTwoPartTariff () {
    return this.code === 'S127'
  }

  isCanalAndRiversTrust () {
    return ['S130U', 'S130S', 'S130T', 'S130W'].includes(this.code)
  }

  /**
   * Multiplication factor 0-1.
   * 1 is normal cost, 0 is 100% discount
   * @return {Number}
   */
  get factor () {
    return this._factor
  }

  set factor (factor) {
    assertFactor(factor)
    this._factor = factor
  }

  /**
   * Date deleted
   * @param {String} timestamp
   */
  set dateDeleted (value) {
    this._dateDeleted = value === null ? null : this.getDateTimeFromValue(value)
  }

  get dateDeleted () {
    return this._dateDeleted
  }
}

module.exports = Agreement
