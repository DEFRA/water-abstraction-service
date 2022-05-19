'use strict'

const Model = require('./model')
const DateRange = require('./date-range')
const validators = require('./validators')

class ReturnCycle extends Model {
  constructor (id) {
    super(id)
    this._returnVersions = []
  }

  /**
   * Date range of return cycle
   * @param {DateRange} dateRange
   */
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange)
    this._dateRange = dateRange
  }

  get dateRange () {
    return this._dateRange
  }

  /**
   * Whether this is a summer return
   * @param {Boolean}
   */
  set isSummer (isSummer) {
    validators.assertIsBoolean(isSummer)
    this._isSummer = isSummer
  }

  get isSummer () {
    return this._isSummer
  }
}

module.exports = ReturnCycle
