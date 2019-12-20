'use strict';

const Model = require('./model');
const { assertDate } = require('./validators');

class DateRange extends Model {
  get startDate () {
    return this._startDate;
  }

  set startDate (date) {
    assertDate(date);
    this._startDate = date;
  }

  get endDate () {
    return this._endDate;
  }

  set endDate (date) {
    assertDate(date);
    this._endDate = date;
  }
}

module.exports = DateRange;
