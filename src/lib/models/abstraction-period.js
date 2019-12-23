const Model = require('./model');
const { assertDay, assertMonth } = require('./validators');

class AbstractionPeriod extends Model {
  get startDay () {
    return this._startDay;
  }

  set startDay (day) {
    assertDay(day);
    this._startDay = day;
  }

  get startMonth () {
    return this._startMonth;
  }

  set startMonth (month) {
    assertMonth(month);
    this._startMonth = month;
  }

  get endDay () {
    return this._endDay;
  }

  set endDay (day) {
    assertDay(day);
    this._endDay = day;
  }

  get endMonth () {
    return this._endMonth;
  }

  set endMonth (month) {
    assertMonth(month);
    this._endMonth = month;
  }
}

module.exports = AbstractionPeriod;
