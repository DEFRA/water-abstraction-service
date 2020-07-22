'use strict';

const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(require('moment'));

const validators = require('./validators');
const DATE_FORMAT = 'YYYY-MM-DD';

class DateRange {
  /**
   *
   * @param {String} startDate The start date in the format YYYY-MM-DD
   * @param {String} [endDate] Optional end date in the format YYYY-MM-DD
   */
  constructor (startDate, endDate) {
    if (startDate) {
      this.startDate = startDate;
    }
    if (endDate !== undefined) {
      this.endDate = endDate;
    }
  }

  /**
   * Gets start date
   * @return {String} format YYYY-MM-DD
   */
  get startDate () {
    return this._startDate;
  }

  set startDate (date) {
    validators.assertDate(date);
    this._startDate = date;
  }

  /**
   * Gets end date
   * @return {String} format YYYY-MM-DD
   */
  get endDate () {
    return this._endDate;
  }

  set endDate (date) {
    validators.assertNullableDate(date);
    this._endDate = date;
  }

  /**
   * Gets a moment range for this date range
   * @return {MomentRange}
   */
  toMomentRange () {
    return moment.range(this._startDate, this._endDate);
  }

  /**
   * Checks whether this date range includes the specified date
   * @param {String} date
   * @return {Boolean}
   */
  includes (date) {
    const range = this.toMomentRange();
    const m = moment(date, DATE_FORMAT);
    return range.contains(m);
  }

  /**
   * Checks whether this date range overlaps another
   * @param {DateRange}
   * @return {Boolean}
   */
  overlaps (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange);
    const rangeA = this.toMomentRange();
    const rangeB = dateRange.toMomentRange();
    return rangeA.overlaps(rangeB);
  }

  /**
   * Number of days in date range
   * @return {Number}
   */
  get days () {
    // If open-ended range, not possible to get days in range
    if (this.endDate === null) {
      return null;
    }
    const startMoment = moment(this.startDate);
    const endMoment = moment(this.endDate);
    return endMoment.diff(startMoment, 'days');
  }

  /**
   * Create a DateRange from a moment range
   * @param {MomentRange} momentRange
   * @return {DateRange}
   */
  static fromMomentRange (momentRange) {
    const startDate = momentRange.start.format(DATE_FORMAT);
    const endDate = momentRange.end.format(DATE_FORMAT);
    return new DateRange(startDate, endDate);
  }

  toJSON () {
    return {
      startDate: this._startDate,
      endDate: this._endDate
    };
  }
}

module.exports = DateRange;
