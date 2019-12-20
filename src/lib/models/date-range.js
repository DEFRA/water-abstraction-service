'use strict';

const { assertDate } = require('./validators');

class DateRange {
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
    assertDate(date);
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
    assertDate(date);
    this._endDate = date;
  }

  toJSON () {
    return {
      startDate: this._startDate,
      endDate: this._endDate
    };
  }
}

module.exports = DateRange;
