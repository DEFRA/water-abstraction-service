'use strict';

const moment = require('moment-range').extendMoment(require('moment'));
const helpers = require('@envage/water-abstraction-helpers');

const { CHARGE_SEASON } = require('./constants');
const Model = require('./model');
const DateRange = require('./date-range');
const validators = require('./validators');

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

  const mStart = moment({
    year: startYear,
    month: startMonth - 1,
    date: startDay
  });

  const mEnd = moment({
    year: endYear,
    month: endMonth - 1,
    date: endDay
  });

  return moment.range(mStart, mEnd);
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
    validators.assertDay(day);
    this._startDay = parseInt(day);
  }

  /**
   * Start month for the abstraction period 1-12
   * @return {Number}
   */
  get startMonth () {
    return this._startMonth;
  }

  set startMonth (month) {
    validators.assertMonth(month);
    this._startMonth = parseInt(month);
  }

  /**
   * End day for the abstraction period 1-31
   * @return {Number}
   */
  get endDay () {
    return this._endDay;
  }

  set endDay (day) {
    validators.assertDay(day);
    this._endDay = parseInt(day);
  }

  /**
   * End month for the abstraction period 1-12
   * @return {Number}
   */
  get endMonth () {
    return this._endMonth;
  }

  set endMonth (month) {
    validators.assertMonth(month);
    this._endMonth = parseInt(month);
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
   * AbstractionPeriod, including the boundaries.
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

  /**
   * Checks whether the supplied date falls inside this abstraction period
   * @param {String} date
   * @return {Boolean}
   */
  isDateWithinAbstractionPeriod (date) {
    const m = this.getDateOrThrow(date);
    return helpers.returns.date.isDateWithinAbstractionPeriod(m.format('YYYY-MM-DD'), {
      periodStartDay: this._startDay,
      periodStartMonth: this._startMonth,
      periodEndDay: this._endDay,
      periodEndMonth: this._endMonth
    });
  }

  /**
   * Gets the number of abstraction days for the supplied DateRange
   * The date range must fall within a single financial year
   * @param {DateRange} dateRange
   * @return {Number}
   */
  getDays (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange);
    const absPeriod = {
      startMonth: this._startMonth,
      startDay: this._startDay,
      endMonth: this._endMonth,
      endDay: this._endDay
    };
    return helpers.charging.getBillableDays(absPeriod, dateRange.startDate, dateRange.endDate);
  }

  /**
   * Returns true if the date range falls in, or overlaps with
   * this abstraction period
   * @param {DateRange} dateRange
   * @return {Boolean}
   */
  isDateRangeOverlapping (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange);
    return [
      this.isDateWithinAbstractionPeriod(dateRange.startDate),
      this.isDateWithinAbstractionPeriod(dateRange.endDate)
    ].includes(true);
  }
}

module.exports = AbstractionPeriod;
