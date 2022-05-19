'use strict'

const DateRange = require('./date-range')
const { assertNullableDate } = require('./validators')

class OpenDateRange extends DateRange {
  /**
   * Gets end date
   * @return {String} format YYYY-MM-DD
   */
  get endDate () {
    return this._endDate
  }

  set endDate (date) {
    assertNullableDate(date)
    this._endDate = date
  }
}

module.exports = OpenDateRange
