const Model = require('./model');
const { assertDay, assertMonth } = require('./validators');

class AbstractionPeriod extends Model {
  /**
   * Start day for the abstraction period 1-31
   * @return {Number}
   */
  get startDay () {
    return this._startDay;
  }

  set startDay (day) {
    assertDay(day);
    this._startDay = day;
  }

  /**
   * Start month for the abstraction period 1-12
   * @return {Number}
   */
  get startMonth () {
    return this._startMonth;
  }

  set startMonth (month) {
    assertMonth(month);
    this._startMonth = month;
  }

  /**
   * End day for the abstraction period 1-31
   * @return {Number}
   */
  get endDay () {
    return this._endDay;
  }

  set endDay (day) {
    assertDay(day);
    this._endDay = day;
  }

  /**
   * End month for the abstraction period 1-12
   * @return {Number}
   */
  get endMonth () {
    return this._endMonth;
  }

  set endMonth (month) {
    assertMonth(month);
    this._endMonth = month;
  }
}

module.exports = AbstractionPeriod;
