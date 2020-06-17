'use strict';

const { CHARGE_SEASON } = require('./constants');
const Model = require('./model');
const { assertDay, assertMonth } = require('./validators');

const moment = require('moment');

const getDayOfYear = (day, month) =>
  moment().month(month - 1).date(day).dayOfYear();

const getDayOfYearRange = abstractionPeriod => {
  const start = getDayOfYear(abstractionPeriod.startDay, abstractionPeriod.startMonth);
  const end = getDayOfYear(abstractionPeriod.endDay, abstractionPeriod.endMonth);

  return {
    start,
    end,
    isCrossYear: end < start,
    correction: moment().isLeapYear() ? 366 : 356
  };
};

const singleYearRangeWithinMultiYearRange = (range, otherRange) => {
  return (range.start > otherRange.start && range.end < otherRange.end + otherRange.correction) ||
      (range.start < otherRange.end && range.end < otherRange.end);
};

const multiYearRangeWithinMultiYearRange = (range, otherRange) => {
  return (range.start > otherRange.start) && (range.end < otherRange.end);
};

const multiYearRangeWithinSingleYearRange = (range, otherRange) => {
  return (
    (range.start > otherRange.start && range.start < otherRange.end) &&
    (range.end > otherRange.start && range.end < otherRange.end)
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
    const range = getDayOfYearRange(this);
    const otherRange = getDayOfYearRange(period);

    // ||----------------------------------------------------||
    // ||--- other range ---|----------|---- other range ----||
    // ||-------------|---- this range ----|-----------------||
    if (!range.isCrossYear && otherRange.isCrossYear) {
      return singleYearRangeWithinMultiYearRange(range, otherRange);
    }

    // ||----------------------------------------------------||
    // ||--- other range ---|----------|---- other range ----||
    // ||--- this range ---|--------------|--- this range ---||
    if (range.isCrossYear && otherRange.isCrossYear) {
      return multiYearRangeWithinMultiYearRange(range, otherRange);
    }

    // ||----------------------------------------------------||
    // ||------------|---- other range ----|-----------------||
    // ||--- this range ---|------------|---- this range ----||
    if (range.isCrossYear) {
      return multiYearRangeWithinSingleYearRange(range, otherRange);
    }

    return range.start > otherRange.start && range.end < otherRange.end;
  }

  /**
   * Gets a default charge season for the defined abstraction period.
   *
   * This is a starting point in some cases where additional logic (TPT etc)
   * will need to be overlayed.
   */
  getChargeSeason () {
    // For the season to be summer, this abstraction period must
    // sit within (not touch the edges) of the summer period
    // 01/04 - 31/10
    if (this.isWithinAbstractionPeriod(AbstractionPeriod.getSummer())) {
      return CHARGE_SEASON.summer;
    }

    // For the season to be winter, this abstraction period must
    // sit within (not touch the edges) of the winter period
    // 01/11 - 31/03
    if (this.isWithinAbstractionPeriod(AbstractionPeriod.getWinter())) {
      return CHARGE_SEASON.winter;
    }

    return CHARGE_SEASON.allYear;
  }
}

module.exports = AbstractionPeriod;
