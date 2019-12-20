'use strict';

const DateRange = require('./model');
const { assertNullableDate } = require('./validators');

class OpenDateRange extends DateRange {
  set endDate (date) {
    assertNullableDate(date);
    this._endDate = date;
  }
}

module.exports = OpenDateRange;
