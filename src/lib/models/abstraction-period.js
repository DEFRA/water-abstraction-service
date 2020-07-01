'use strict';

const moment = require('moment-range').extendMoment(require('moment'));

const { CHARGE_SEASON } = require('./constants');
const Model = require('./model');
const { assertDay, assertMonth } = require('./validators');

/**
 * Creates a moment range from the supplied abs period in the specified year
 * @param {AbstractionPeriod} abstractionPeriod
 * @param {Number} startYear
 * @return {MomentRange}
 */
const createRange = (abstractionPeriod, startYear) => {
  const { startDay, endDay, startMonth, endMonth } = abstractionPeriod;
  const isCrossYear = (startMonth > endMonth || (startMonth === endMonth && startDay > endDay));
  const endYear = isCrossYear ? startYear + 1 : startYear;
  return moment.range(
    `${startYear}-${startMonth}-${startDay}`,
    `${endYear}-${endMonth}-${endDay}`
  );
};

class AbstractionPeriod extends Model {
  static getSummer () {
    const summer = new AbstractionPeriod();
    summer.setDates(1, 4, 31, 10);
    return summer;
  }

  static getWinter () {
    const winter = new AbstractionPeriod();
    winter.setDates(1, 11, 31, 3);
    return winter;
  }

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

  /**
   * Sets the abstraction period
   *
   * @param {Number} startDay
   * @param {Number} startMonth
   * @param {Number} endDay
   * @param {Number} endMonth
   */
  setDates (startDay, startMonth, endDay, endMonth) {
    this.startDay = startDay;
    this.startMonth = startMonth;
    this.endDay = endDay;
    this.endMonth = endMonth;
  }

  /**
   * Checks if the passed AbstractionPeriod contains this instance. In order
   * for this to return true, this instance must fit inside the passed
   * AbstractionPeriod, but not matching the bounaries.
   *
   * @param {AbstractionPeriod} period The abstraction period to check if this instance fits within
   */
  isWithinAbstractionPeriod (period) {
    const thisRange = createRange(this, 2018);
    const testRanges = [createRange(period, 2017), createRange(period, 2018)];
    return testRanges.some(range => range.contains(thisRange));
  }

  /**
   * Gets a default charge season for the defined abstraction period.
   *
   * This is a starting point in some cases where additional logic (TPT etc)
   * will need to be overlayed.
   */
  getChargeSeason () {
    // For the season to be summer, this abstraction period must
    // sit within the summer period (01/04 - 31/10)
    if (this.isWithinAbstractionPeriod(AbstractionPeriod.getSummer())) {
      return CHARGE_SEASON.summer;
    }

    // For the season to be winter, this abstraction period must
    // sit within the winter period (01/11 - 31/03)
    if (this.isWithinAbstractionPeriod(AbstractionPeriod.getWinter())) {
      return CHARGE_SEASON.winter;
    }

    return CHARGE_SEASON.allYear;
  }
}

module.exports = AbstractionPeriod;
