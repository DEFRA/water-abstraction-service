'use strict'

const MomentRange = require('moment-range')
const moment = MomentRange.extendMoment(require('moment'))

const validators = require('./validators')
const DATE_FORMAT = 'YYYY-MM-DD'
const { getDateTimeFromValue } = require('../dates')

class DateRange {
  /**
   *
   * @param {String} startDate The start date in the format YYYY-MM-DD
   * @param {String} [endDate] Optional end date in the format YYYY-MM-DD
   */
  constructor (startDate, endDate) {
    if (startDate) {
      this.startDate = startDate
    }
    if (endDate !== undefined) {
      this.endDate = endDate
    }
  }

  /**
   * Gets start date
   * @return {String} format YYYY-MM-DD
   */
  get startDate () {
    return this._startDate ? this._startDate.format(DATE_FORMAT) : this._startDate
  }

  set startDate (date) {
    const m = getDateTimeFromValue(date)
    if (m === null) {
      throw new Error('startDate cannot be null')
    }
    this._startDate = m
  }

  /**
   * Gets end date
   * @return {String} format YYYY-MM-DD
   */
  get endDate () {
    return this._endDate ? this._endDate.format(DATE_FORMAT) : this._endDate
  }

  set endDate (date) {
    this._endDate = getDateTimeFromValue(date)
  }

  /**
   * Gets a moment range for this date range
   * @return {MomentRange}
   */
  toMomentRange () {
    return moment.range(this._startDate, this._endDate)
  }

  /**
   * Checks whether this date range includes the specified date
   * @param {String} date
   * @return {Boolean}
   */
  includes (date) {
    const range = this.toMomentRange()
    const m = moment(date, DATE_FORMAT)
    return range.contains(m)
  }

  /**
   * Checks whether this date range overlaps another
   * @param {DateRange} dateRange
   * @return {Boolean}
   */
  overlaps (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange)
    const rangeA = this.toMomentRange()
    const rangeB = dateRange.toMomentRange()
    return rangeA.overlaps(rangeB, { adjacent: true })
  }

  /**
   * Number of days in date range
   * @return {Number}
   */
  get days () {
    // If open-ended range, not possible to get days in range
    if (this?.endDate === null) {
      return undefined
    }

    return this._endDate.diff(this._startDate, 'days') + 1
  }

  /**
   * Create a DateRange from a moment range
   * @param {MomentRange} momentRange
   * @return {DateRange}
   */
  static fromMomentRange (momentRange) {
    return new DateRange(momentRange.start, momentRange.end)
  }

  toJSON () {
    return {
      startDate: this.startDate,
      endDate: this.endDate
    }
  }

  /**
   * Checks whether this date range is a financial year
   * @return {Boolean}
   */
  get isFinancialYear () {
    const startYear = this._startDate.year()

    return (this.startDate === `${startYear}-04-01`) &&
     (this.endDate === `${startYear + 1}-03-31`)
  }

  /**
   * Checks if the start date matches the supplied date
   *
   * @param {String|Moment|Date} date
   * @return {Boolean}
   */
  isStartDate (date) {
    const m = getDateTimeFromValue(date)
    return this._startDate.isSame(m, 'day')
  }

  /**
   * Checks if this range started on or after the supplied date
   * @param {String} date
   * @return {Boolean}
   */
  isSameOrAfter (date) {
    const m = getDateTimeFromValue(date)
    return this._startDate.isSameOrAfter(m, 'day')
  }
}

module.exports = DateRange
